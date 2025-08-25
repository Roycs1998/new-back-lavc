import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { Model, SortOrder, Types } from 'mongoose';
import { UserRole } from 'src/common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { PaginatedResult } from 'src/common/interface/pagination.interface';
import { PersonsService } from 'src/persons/persons.service';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { CreateUserWithPersonDto } from 'src/persons/dto/create-user-with-person.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { asDate } from 'src/utils/asDate';
import { escapeRegex } from 'src/utils/escapeRegex';
import { sanitizeFlat } from 'src/utils/sanitizeFlat';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(forwardRef(() => PersonsService))
    private personsService: PersonsService,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDocument> {
    if (dto.role === UserRole.COMPANY_ADMIN && !dto.companyId) {
      throw new BadRequestException(
        'Company ID is required for company admin role',
      );
    }
    if (dto.role !== UserRole.COMPANY_ADMIN && dto.companyId) {
      throw new BadRequestException(
        'Company ID should only be provided for company admin role',
      );
    }

    try {
      const email = dto.email.trim().toLowerCase();
      const exists = await this.userModel.exists({
        email,
        entityStatus: { $ne: EntityStatus.DELETED },
      });
      if (exists) throw new ConflictException('Email already exists');

      const password = await bcrypt.hash(dto.password, 12);
      const user = new this.userModel({
        ...dto,
        email,
        password,
        personId: new Types.ObjectId(dto.personId),
        companyId: dto.companyId
          ? new Types.ObjectId(dto.companyId)
          : undefined,
        entityStatus: EntityStatus.ACTIVE,
      });
      return await user.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }
  }

  async createUserWithPerson(
    dto: CreateUserWithPersonDto,
  ): Promise<{ user: UserDocument; person: any }> {
    const email = dto.email.trim().toLowerCase();
    const existingUser = await this.userModel.findOne({
      email,
      entityStatus: { $ne: EntityStatus.DELETED },
    });
    if (existingUser) throw new BadRequestException('Email already exists');

    const person = await this.personsService.createForUser(dto);
    const user = await this.create({
      personId: person._id.toString(),
      email,
      password: dto.password,
      role: dto.role,
      companyId: dto.companyId,
    });

    const populatedUser = await this.userModel
      .findById(user._id)
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .exec();

    if (!populatedUser)
      throw new NotFoundException('User not found after creation');

    return { user: populatedUser, person };
  }

  async findAll(
    filterDto: UserFilterDto,
  ): Promise<PaginatedResult<UserDocument>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      entityStatus,
      role,
      companyId,
      emailVerified,
      search,
      createdFrom,
      createdTo,
    } = filterDto ?? {};

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, any> = {};

    if (entityStatus) filter.entityStatus = entityStatus;
    else filter.entityStatus = { $ne: EntityStatus.DELETED };

    if (role) filter.role = role;
    if (companyId) filter.companyId = new Types.ObjectId(companyId);
    if (typeof emailVerified === 'boolean')
      filter.emailVerified = emailVerified;

    const from = asDate(createdFrom);
    const to = asDate(createdTo);
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    const searchMatch = search?.trim()
      ? {
          $or: [
            { email: { $regex: escapeRegex(search.trim()), $options: 'i' } },
            {
              'person.firstName': {
                $regex: escapeRegex(search.trim()),
                $options: 'i',
              },
            },
            {
              'person.lastName': {
                $regex: escapeRegex(search.trim()),
                $options: 'i',
              },
            },
          ],
        }
      : null;

    const SORT_WHITELIST = new Set([
      'createdAt',
      'updatedAt',
      'email',
      'role',
      'entityStatus',
      'lastLogin',
      'person.firstName',
      'person.lastName',
      'company.name',
    ] as const);
    const sortKey = SORT_WHITELIST.has(sort as any) ? sort : 'createdAt';
    const sortOptions: Record<string, SortOrder> = {
      [sortKey]: order === 'asc' ? 1 : -1,
    };

    const pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'persons',
          localField: 'personId',
          foreignField: '_id',
          as: 'person',
        },
      },
      { $unwind: '$person' },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyId',
          foreignField: '_id',
          as: 'company',
        },
      },
      { $addFields: { company: { $arrayElemAt: ['$company', 0] } } },
    ];

    if (searchMatch) pipeline.push({ $match: searchMatch });

    pipeline.push({
      $facet: {
        data: [{ $sort: sortOptions }, { $skip: skip }, { $limit: safeLimit }],
        count: [{ $count: 'total' }],
      },
    });

    const agg = await this.userModel.aggregate(pipeline).exec();
    const data = (agg?.[0]?.data ?? []) as UserDocument[];
    const totalItems = agg?.[0]?.count?.[0]?.total ?? 0;
    const totalPages = totalItems ? Math.ceil(totalItems / safeLimit) : 1;

    return {
      data,
      totalItems,
      totalPages,
      currentPage: safePage,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    };
  }

  async findOne(id: string, includeDeleted = false): Promise<UserDocument> {
    const filter: any = { _id: id };
    if (!includeDeleted) filter.entityStatus = { $ne: EntityStatus.DELETED };

    const user = await this.userModel
      .findOne(filter)
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .exec();

    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<UserDocument | null> {
    const filter: any = { email: email.trim().toLowerCase() };
    if (!includeDeleted) filter.entityStatus = { $ne: EntityStatus.DELETED };

    return this.userModel
      .findOne(filter)
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .exec();
  }

  async findByEmailForAuth(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.trim().toLowerCase(),
        entityStatus: { $ne: EntityStatus.DELETED },
      })
      .select('+password')
      .exec();
  }

  async findByPersonId(
    personId: string,
    includeDeleted = false,
  ): Promise<UserDocument | null> {
    const filter: any = { personId: new Types.ObjectId(personId) };
    if (!includeDeleted) filter.entityStatus = { $ne: EntityStatus.DELETED };

    return this.userModel
      .findOne(filter)
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    if (dto.role === UserRole.COMPANY_ADMIN && !dto.companyId) {
      throw new BadRequestException(
        'Company ID is required for company admin role',
      );
    }
    if (dto.role !== UserRole.COMPANY_ADMIN && dto.companyId) {
      throw new BadRequestException(
        'Company ID should only be provided for company admin role',
      );
    }

    try {
      if (dto.email) dto.email = dto.email.trim().toLowerCase();

      const existing = await this.userModel
        .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
        .lean();
      if (!existing) throw new NotFoundException('User not found');

      if (dto.email && dto.email !== existing.email) {
        const dup = await this.userModel.exists({
          _id: { $ne: id },
          email: dto.email,
          entityStatus: { $ne: EntityStatus.DELETED },
        });
        if (dup) throw new ConflictException('Email already exists');
      }

      const $set = sanitizeFlat({
        ...dto,
        companyId: dto.companyId
          ? new Types.ObjectId(dto.companyId)
          : undefined,
      });

      if (Object.keys($set).length === 0) {
        const doc = await this.userModel.findById(id).exec();
        if (!doc) throw new NotFoundException('User not found');
        return doc;
      }

      const updated = await this.userModel
        .findOneAndUpdate(
          { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
          { $set, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true, context: 'query' },
        )
        .populate('personId', 'firstName lastName email phone')
        .populate('companyId', 'name contactEmail')
        .exec();

      if (!updated) throw new NotFoundException('User not found');
      return updated;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('Email already exists');
      }
      throw error;
    }
  }

  async updatePassword(id: string, newPassword: string): Promise<UserDocument> {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        {
          $set: { password: hashedPassword },
          $currentDate: { updatedAt: true },
        },
        { new: true },
      )
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        { $currentDate: { lastLogin: true, updatedAt: true } },
      )
      .exec();
  }

  async verifyEmail(id: string): Promise<UserDocument> {
    const user = await this.userModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        {
          $set: { emailVerified: true },
          $unset: { emailVerificationToken: '' },
          $currentDate: { updatedAt: true },
        },
        { new: true },
      )
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .exec();

    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async changeStatus(
    id: string,
    entityStatus: EntityStatus,
    changedBy?: string,
  ): Promise<UserDocument> {
    const update: any = {
      $set: { entityStatus },
      $currentDate: { updatedAt: true },
    };

    if (entityStatus === EntityStatus.DELETED) {
      update.$currentDate.deletedAt = true;
      if (changedBy) update.$set.deletedBy = new Types.ObjectId(changedBy);
    } else {
      update.$unset = { deletedAt: '', deletedBy: '' };
    }

    const doc = await this.userModel
      .findOneAndUpdate({ _id: id }, update, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .exec();

    if (!doc) throw new NotFoundException('User not found');
    return doc;
  }

  async softDelete(id: string, deletedBy?: string): Promise<UserDocument> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }

  async validatePassword(
    user: UserDocument,
    password: string,
  ): Promise<boolean> {
    if (!user.password) {
      const withHash = await this.userModel
        .findById(user._id)
        .select('+password')
        .exec();
      if (!withHash?.password)
        throw new BadRequestException('Password hash not available');
      return bcrypt.compare(password, withHash.password);
    }
    return bcrypt.compare(password, user.password);
  }

  async findUserByVerificationToken(token: string): Promise<string> {
    if (!token || !token.trim()) {
      throw new BadRequestException('Verification token is required');
    }

    const user = await this.userModel
      .findOne({
        emailVerificationToken: token.trim(),
        emailVerified: { $ne: true },
        entityStatus: { $ne: EntityStatus.DELETED },
      })
      .select({ _id: 1 })
      .lean();

    if (!user) {
      throw new NotFoundException('Invalid or expired verification token');
    }

    return String(user._id);
  }

  async findUserByResetToken(token: string): Promise<string> {
    if (!token || !token.trim()) {
      throw new BadRequestException('Reset token is required');
    }

    const tokenTrim = token.trim();

    const now = new Date();

    const user = await this.userModel
      .findOne({
        passwordResetToken: tokenTrim,
        passwordResetExpires: { $gt: now },
        entityStatus: { $ne: EntityStatus.DELETED },
      })
      .select({ _id: 1 })
      .lean();

    if (!user) {
      throw new NotFoundException('Invalid or expired reset token');
    }

    return String(user._id);
  }
}
