import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Person, PersonDocument } from './entities/person.entity';
import { Model, Types } from 'mongoose';
import { PersonType } from 'src/common/enums/person-type.enum';
import { PaginatedResult } from 'src/common/interface/pagination.interface';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { CreateUserWithPersonDto } from './dto/create-user-with-person.dto';
import { CreateSpeakerWithPersonDto } from './dto/create-speaker-with-person.dto';
import { PersonFilterDto } from './dto/person-filter.dto';
import { sanitizeFlat } from 'src/utils/sanitizeFlat';
import { asDate } from 'src/utils/asDate';
import { escapeRegex } from 'src/utils/escapeRegex';
import { normalizeEmail } from 'src/utils/normalizeEmail';

@Injectable()
export class PersonsService {
  constructor(
    @InjectModel(Person.name) private personModel: Model<PersonDocument>,
  ) {}

  async create(createPersonDto: CreatePersonDto): Promise<PersonDocument> {
    try {
      if (createPersonDto.email) {
        const existingPerson = await this.personModel.findOne({
          email: createPersonDto.email,
          entityStatus: { $ne: EntityStatus.DELETED },
        });

        if (existingPerson) {
          throw new BadRequestException('Email already exists');
        }
      }

      const person = new this.personModel({
        ...createPersonDto,
        entityStatus: EntityStatus.ACTIVE,
      });

      return await person.save();
    } catch (error) {
      throw error;
    }
  }

  async createForUser(
    userData: CreateUserWithPersonDto,
  ): Promise<PersonDocument> {
    const personData = {
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      phone: userData.phone,
      dateOfBirth: userData.dateOfBirth,
      type: PersonType.USER_PERSON,
    };

    return this.create(personData);
  }

  async createForSpeaker(
    speakerData: CreateSpeakerWithPersonDto,
  ): Promise<PersonDocument> {
    const personData = {
      firstName: speakerData.firstName,
      lastName: speakerData.lastName,
      email: speakerData.email,
      phone: speakerData.phone,
      type: PersonType.SPEAKER_PERSON,
    };

    return this.create(personData);
  }

  async findAll(filterDto: PersonFilterDto): Promise<PaginatedResult<Person>> {
    const {
      page = 1,
      limit = 20,
      sort = 'createdAt',
      order = 'desc',
      entityStatus,
      type,
      search,
      createdFrom,
      createdTo,
    } = filterDto ?? {};

    const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, any> = {};

    if (entityStatus) filter.entityStatus = entityStatus;
    else filter.entityStatus = { $ne: EntityStatus.DELETED };

    if (type) filter.type = type;

    const from = asDate(createdFrom);
    const to = asDate(createdTo);
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = from;
      if (to) filter.createdAt.$lte = to;
    }

    if (search?.trim()) {
      const q = escapeRegex(search.trim());
      filter.$or = [
        { firstName: { $regex: q, $options: 'i' } },
        { lastName: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const SORT_WHITELIST = new Set([
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
      'type',
      'entityStatus',
    ] as const);

    const sortKey = SORT_WHITELIST.has(sort as any) ? sort : 'createdAt';
    const sortOptions: Record<string, 1 | -1> = {
      [sortKey]: order === 'asc' ? 1 : -1,
    };

    const [data, totalItems] = await Promise.all([
      this.personModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.personModel.countDocuments(filter),
    ]);

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

  async findOne(id: string, includeDeleted = false): Promise<Person> {
    const filter: any = { _id: id };
    if (!includeDeleted) {
      filter.entityStatus = { $ne: EntityStatus.DELETED };
    }

    const person = await this.personModel.findOne(filter).exec();
    if (!person) {
      throw new NotFoundException(`Person with ID ${id} not found`);
    }
    return person;
  }

  async findByEmail(
    email: string,
    includeDeleted = false,
  ): Promise<Person | null> {
    const filter: any = { email };
    if (!includeDeleted) {
      filter.entityStatus = { $ne: EntityStatus.DELETED };
    }

    return this.personModel.findOne(filter).exec();
  }

  async update(id: string, dto: UpdatePersonDto): Promise<Person> {
    if (dto.email) dto.email = normalizeEmail(dto.email);

    const existing = await this.personModel
      .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
      .lean();
    if (!existing) throw new NotFoundException('Person not found');

    if (dto.email && dto.email !== existing.email) {
      const dup = await this.personModel.exists({
        _id: { $ne: id },
        email: dto.email,
        entityStatus: { $ne: EntityStatus.DELETED },
      });
      if (dup) throw new ConflictException('Email already exists');
    }

    const $set = sanitizeFlat(dto);

    if (Object.keys($set).length === 0) {
      const doc = await this.personModel.findById(id).exec();
      if (!doc) throw new NotFoundException('Person not found');
      return doc;
    }

    const updated = await this.personModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        { $set, $currentDate: { updatedAt: true } },
        { new: true, runValidators: true, context: 'query' },
      )
      .exec();

    if (!updated) throw new NotFoundException('Person not found');
    return updated;
  }

  async softDelete(id: string, deletedBy?: string): Promise<Person> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }

  async changeStatus(
    id: string,
    entityStatus: EntityStatus,
    changedBy?: string,
  ): Promise<Person> {
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

    const doc = await this.personModel
      .findOneAndUpdate({ _id: id }, update, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .exec();

    if (!doc) throw new NotFoundException('Person not found');
    return doc;
  }
}
