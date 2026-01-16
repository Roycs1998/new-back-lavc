import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './entities/user.entity';
import { FilterQuery, Model, SortOrder, Types } from 'mongoose';
import { UserRole } from 'src/common/enums/user-role.enum';
import * as bcrypt from 'bcrypt';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { UserFilterDto } from './dto/user-filter.dto';
import { asDate } from 'src/utils/asDate';
import { escapeRegex } from 'src/utils/escapeRegex';
import { sanitizeFlat } from 'src/utils/sanitizeFlat';
import { UserDto } from './dto/user.dto';
import { UserPaginatedDto } from './dto/user-pagination.dto';
import { toDto } from 'src/utils/toDto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async create(dto: CreateUserDto): Promise<UserDto> {
    if (
      dto.roles?.includes(UserRole.COMPANY_ADMIN) &&
      (!dto.companyIds || dto.companyIds.length === 0)
    ) {
      throw new BadRequestException(
        'Se requiere al menos una empresa para el rol de administrador de empresa.',
      );
    }
    if (dto.roles?.includes(UserRole.USER) && dto.companyIds?.length) {
      throw new BadRequestException(
        'Las empresas solo deben proporcionarse para el rol de administrador de empresa.',
      );
    }

    const email = dto.email.trim().toLowerCase();

    const exists = await this.userModel.exists({
      email,
      entityStatus: { $ne: EntityStatus.DELETED },
    });

    if (exists) throw new ConflictException('El email ya está registrado');

    const password = await bcrypt.hash(dto.password, 12);

    const created = await this.userModel.create({
      email,
      password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      avatar: dto.avatar,
      roles: dto.roles && dto.roles.length ? dto.roles : [UserRole.USER],
      companyIds: dto.companyIds
        ? dto.companyIds.map((id) => new Types.ObjectId(id))
        : [],
      entityStatus: EntityStatus.ACTIVE,
    });

    const user = await this.userModel
      .findById(created._id)
      .populate([{ path: 'companies' }])
      .exec();

    if (!user) {
      throw new InternalServerErrorException('No se pudo crear el usuario.');
    }

    return toDto(user, UserDto);
  }

  async findAll(filterDto: UserFilterDto): Promise<UserPaginatedDto> {
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

    const filter: FilterQuery<User> = {};

    if (entityStatus) filter.entityStatus = entityStatus;
    else filter.entityStatus = { $ne: EntityStatus.DELETED };

    if (role) filter.roles = { $in: [role] };
    if (companyId) filter.companyIds = new Types.ObjectId(companyId);
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
              firstName: {
                $regex: escapeRegex(search.trim()),
                $options: 'i',
              },
            },
            {
              lastName: {
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
      'roles',
      'entityStatus',
      'lastLogin',
      'firstName',
      'lastName',
      'companies.name',
    ] as const);

    const sortKey = SORT_WHITELIST.has(sort as any) ? sort : 'createdAt';
    const sortOptions: Record<string, SortOrder> = {
      [sortKey]: order === 'asc' ? 1 : -1,
    };

    const pipeline: any[] = [
      { $match: filter },
      {
        $lookup: {
          from: 'companies',
          localField: 'companyIds',
          foreignField: '_id',
          as: 'companies',
        },
      },
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
      data: data.map((doc) => toDto(doc, UserDto)),
      totalItems,
      totalPages,
      currentPage: safePage,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    };
  }

  async findOne(id: string, includeDeleted = false): Promise<UserDto> {
    const filter: any = { _id: id };
    if (!includeDeleted) filter.entityStatus = { $ne: EntityStatus.DELETED };

    const user = await this.userModel
      .findOne(filter)
      .populate([{ path: 'companies' }])
      .exec();

    if (!user)
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);

    return toDto(user, UserDto);
  }

  async update(id: string, dto: UpdateUserDto): Promise<UserDocument> {
    if (
      dto.roles?.includes(UserRole.COMPANY_ADMIN) &&
      (!dto.companyIds || dto.companyIds.length === 0)
    ) {
      throw new BadRequestException(
        'Se requiere al menos una empresa para el rol de administrador de empresa.',
      );
    }
    if (dto.roles?.includes(UserRole.USER) && dto.companyIds?.length) {
      throw new BadRequestException(
        'Las empresas solo deben proporcionarse para el rol de administrador de empresa.',
      );
    }

    if (dto.email) dto.email = dto.email.trim().toLowerCase();

    const existing = await this.userModel
      .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
      .lean();

    if (!existing) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== existing.email) {
      const dup = await this.userModel.exists({
        _id: { $ne: id },
        email: dto.email,
        entityStatus: { $ne: EntityStatus.DELETED },
      });
      if (dup) throw new ConflictException('El email ya está registrado');
    }

    const { firstName, lastName, phone, dateOfBirth, ...userFields } = dto;
    const $set = sanitizeFlat({
      ...userFields,
      firstName,
      lastName,
      phone,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
      companyIds: userFields.companyIds
        ? userFields.companyIds.map((id) => new Types.ObjectId(id))
        : undefined,
    });

    const updated = await this.userModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        { $set, $currentDate: { updatedAt: true } },
        { new: true, runValidators: true, context: 'query' },
      )
      .populate([{ path: 'companies' }])
      .exec();

    if (!updated) throw new NotFoundException('Usuario no encontrado');

    return updated;
  }

  async updatePassword(id: string, newPassword: string): Promise<UserDto> {
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
      .populate([{ path: 'companies' }])
      .exec();

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return toDto(user, UserDto);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.userModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        { $currentDate: { lastLogin: true, updatedAt: true } },
      )
      .exec();
  }

  async verifyEmail(id: string): Promise<UserDto> {
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
      .populate([{ path: 'companies' }])
      .exec();

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return toDto(user, UserDto);
  }

  async changeStatus(
    id: string,
    entityStatus: EntityStatus,
    changedBy?: string,
  ): Promise<UserDto> {
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
      .populate([{ path: 'companies' }])
      .exec();

    if (!doc) throw new NotFoundException('Usuario no encontrado');

    return toDto(doc, UserDto);
  }

  async softDelete(id: string, deletedBy?: string): Promise<UserDto> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<UserDto | null> {
    const filter: FilterQuery<User> = { email: email.trim().toLowerCase() };
    if (!includeDeleted) filter.entityStatus = { $ne: EntityStatus.DELETED };

    const user = await this.userModel
      .findOne(filter)
      .populate([{ path: 'companies' }])
      .exec();

    if (!user) {
      return null;
    }

    return toDto(user, UserDto);
  }

  async validatePassword(userId: string, password: string): Promise<boolean> {
    const withHash = await this.userModel
      .findById(new Types.ObjectId(userId))
      .select('+password')
      .exec();

    if (!withHash?.password)
      throw new BadRequestException('Hash de contraseña no disponible');

    return bcrypt.compare(password, withHash.password);
  }

  async findUserByVerificationToken(token: string): Promise<string> {
    if (!token || !token.trim()) {
      throw new BadRequestException('Se requiere un token de verificación.');
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
      throw new NotFoundException('Token de verificación no válido o caducado');
    }

    return String(user._id);
  }

  async findUserByResetToken(token: string): Promise<string> {
    if (!token || !token.trim()) {
      throw new BadRequestException(
        'Se requiere un token de restablecimiento.',
      );
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
      throw new NotFoundException(
        'Token de restablecimiento no válido o caducado',
      );
    }

    return String(user._id);
  }

  async findUserWithSensitiveFields(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
      .exec();
  }

  async findUserByEmailWithSensitiveFields(
    email: string,
  ): Promise<UserDocument | null> {
    return this.userModel
      .findOne({
        email: email.trim().toLowerCase(),
        entityStatus: { $ne: EntityStatus.DELETED },
      })
      .select('+password')
      .populate([{ path: 'companies' }])
      .exec();
  }

  async getAllStaffRoles(userId: string) {
    const now = new Date();

    // 1. Buscar asignaciones de staff operativo
    const operationalStaffAssignments = await this.userModel
      .aggregate([
        { $match: { _id: new Types.ObjectId(userId) } },
        {
          $lookup: {
            from: 'event_participants',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$participantType', 'operational_staff'] },
                      { $eq: ['$isActive', true] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'events',
                  localField: 'eventId',
                  foreignField: '_id',
                  as: 'event',
                },
              },
              { $unwind: '$event' },
            ],
            as: 'operationalStaff',
          },
        },
        {
          $lookup: {
            from: 'event_participants',
            let: { userId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ['$userId', '$$userId'] },
                      { $eq: ['$participantType', 'staff'] },
                      { $eq: ['$isActive', true] },
                    ],
                  },
                },
              },
              {
                $lookup: {
                  from: 'events',
                  localField: 'eventId',
                  foreignField: '_id',
                  as: 'event',
                },
              },
              { $unwind: '$event' },
              {
                $lookup: {
                  from: 'event_sponsors',
                  localField: 'eventSponsorId',
                  foreignField: '_id',
                  as: 'sponsor',
                },
              },
              {
                $unwind: { path: '$sponsor', preserveNullAndEmptyArrays: true },
              },
              {
                $lookup: {
                  from: 'companies',
                  localField: 'sponsor.companyId',
                  foreignField: '_id',
                  as: 'company',
                },
              },
              {
                $unwind: { path: '$company', preserveNullAndEmptyArrays: true },
              },
            ],
            as: 'sponsorStaff',
          },
        },
      ])
      .exec();

    if (
      !operationalStaffAssignments ||
      operationalStaffAssignments.length === 0
    ) {
      return {
        hasStaffRoles: false,
        operationalStaff: [],
        sponsorStaff: [],
      };
    }

    const result = operationalStaffAssignments[0];

    // Filtrar staff operativo (eventos no finalizados)
    const operationalStaff = (result.operationalStaff || [])
      .filter((assignment: any) => {
        const event = assignment.event;
        return event.endDate && now <= new Date(event.endDate);
      })
      .map((assignment: any) => ({
        eventId: assignment.event._id.toString(),
        eventTitle: assignment.event.title,
        eventStartDate: assignment.event.startDate,
        eventEndDate: assignment.event.endDate,
        participantId: assignment._id.toString(),
        role: 'operational_staff',
        canAccess: true,
      }));

    // Filtrar staff de sponsor (sponsors activos)
    const sponsorStaff = (result.sponsorStaff || [])
      .filter((assignment: any) => {
        const event = assignment.event;
        const sponsor = assignment.sponsor;
        return (
          event.endDate && now <= new Date(event.endDate) && sponsor?.isActive
        );
      })
      .map((assignment: any) => ({
        eventId: assignment.event._id.toString(),
        eventTitle: assignment.event.title,
        sponsorId: assignment.sponsor?._id.toString(),
        sponsorName: assignment.company?.name || 'Sponsor',
        participantId: assignment._id.toString(),
        role: 'sponsor_staff',
        canAccess: true,
      }));

    return {
      hasStaffRoles: operationalStaff.length > 0 || sponsorStaff.length > 0,
      operationalStaff,
      sponsorStaff,
    };
  }
}
