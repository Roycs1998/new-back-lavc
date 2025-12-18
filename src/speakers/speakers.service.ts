import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { InjectModel } from '@nestjs/mongoose';
import {
  Speaker,
  SpeakerDocument,
  UploadSource,
} from './entities/speaker.entity';
import {
  FilterQuery,
  Model,
  ProjectionType,
  QueryOptions,
  Types,
} from 'mongoose';
import { PersonsService } from 'src/persons/persons.service';
import { CompaniesService } from 'src/companies/companies.service';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { CreateSpeakerWithPersonDto } from 'src/persons/dto/create-speaker-with-person.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { toObjectId } from 'src/utils/toObjectId';
import { sanitizeDefined } from 'src/utils/sanitizeDefined';
import { SpeakerDto } from './dto/speaker.dto';
import { SpeakerPaginatedDto } from './dto/speaker-pagination.dto';
import { toDto } from 'src/utils/toDto';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>,
    @Inject(forwardRef(() => PersonsService))
    private personsService: PersonsService,
    @Inject(forwardRef(() => CompaniesService))
    private companiesService: CompaniesService,
  ) {}

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: CreateSpeakerDto, createdBy?: string): Promise<SpeakerDto> {
    const company = await this.companiesService.findOne(dto.companyId);
    if (company.entityStatus !== EntityStatus.ACTIVE)
      throw new BadRequestException('La empresa no está activa.');

    const doc = await this.speakerModel.create({
      ...dto,
      personId: toObjectId(dto.personId),
      companyId: toObjectId(dto.companyId),
      entityStatus: EntityStatus.ACTIVE,
      createdBy: createdBy ? toObjectId(createdBy) : undefined,
    });

    return toDto(doc, SpeakerDto);
  }

  async createSpeakerWithPerson(
    dto: CreateSpeakerWithPersonDto,
    createdBy?: string,
  ): Promise<SpeakerDto> {
    const company = await this.companiesService.findOne(dto.companyId);
    if (company.entityStatus !== EntityStatus.ACTIVE)
      throw new BadRequestException('La empresa no está activa.');

    const person = await this.personsService.createForSpeaker(dto);

    const speaker = await this.create(
      {
        personId: person.id,
        companyId: dto.companyId,
        specialty: dto.specialty,
        biography: dto.biography,
        yearsExperience: dto.yearsExperience,
        certifications: dto.certifications,
        hourlyRate: dto.hourlyRate,
        currency: dto.currency,
        socialMedia: dto.socialMedia,
        languages: dto.languages,
        topics: dto.topics,
        audienceSize: dto.audienceSize,
        notes: dto.notes,
        uploadedVia: UploadSource.MANUAL,
      },
      createdBy,
    );

    const populated = await this.speakerModel
      .findById(speaker.id)
      .populate([{ path: 'person' }, { path: 'company' }])
      .exec();

    if (!populated)
      throw new NotFoundException(
        'Orador no encontrado después de la creación',
      );

    return toDto(populated, SpeakerDto);
  }

  async findAll(filter: SpeakerFilterDto): Promise<SpeakerPaginatedDto> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      companyId,
      specialty,
      languages,
      topics,
      minYears,
      maxYears,
      minRate,
      maxRate,
      currency,
      uploadedVia,
      entityStatus,
      createdFrom,
      createdTo,
      includeDeleted,
    } = filter;

    const q: FilterQuery<Speaker> = {};

    if (entityStatus) q.entityStatus = entityStatus;
    else q.entityStatus = { $ne: EntityStatus.DELETED };

    if (!includeDeleted) {
      q.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
    }

    if (companyId) q.companyId = toObjectId(companyId);

    if (search && search.trim()) {
      q.$text = { $search: search.trim() };
    }

    if (specialty && specialty.trim()) {
      q.specialty = new RegExp(`^${this.escapeRegex(specialty.trim())}$`, 'i');
    }

    if (Array.isArray(languages) && languages.length) {
      q.languages = { $in: languages.map((l) => l.trim().toLowerCase()) };
    }
    if (Array.isArray(topics) && topics.length) {
      q.topics = { $in: topics.map((t) => t.trim().toLowerCase()) };
    }

    if (minYears != null || maxYears != null) {
      q.yearsExperience = {};
      if (minYears != null) q.yearsExperience.$gte = Number(minYears);
      if (maxYears != null) q.yearsExperience.$lte = Number(maxYears);
    }
    if (minRate != null || maxRate != null) {
      q.hourlyRate = {};
      if (minRate != null) q.hourlyRate.$gte = Number(minRate);
      if (maxRate != null) q.hourlyRate.$lte = Number(maxRate);
    }

    if (currency) q.currency = currency;
    if (uploadedVia) q.uploadedVia = uploadedVia;

    if (createdFrom || createdTo) {
      q.createdAt = {};
      if (createdFrom) q.createdAt.$gte = new Date(createdFrom);
      if (createdTo) q.createdAt.$lte = new Date(createdTo);
    }

    const sortObj: Record<string, 1 | -1> = {};

    const dir: 1 | -1 = order === 'asc' ? 1 : -1;
    if (sort === 'specialty') sortObj['specialty'] = dir;
    else if (sort === 'yearsExperience') sortObj['yearsExperience'] = dir;
    else if (sort === 'hourlyRate') sortObj['hourlyRate'] = dir;
    else if (sort === 'updatedAt') sortObj['updatedAt'] = dir;
    else sortObj['createdAt'] = dir;

    const projection: ProjectionType<Speaker> = {};

    const mongoQuery = this.speakerModel
      .find(q, projection, {
        collation: { locale: 'es', strength: 2 },
      } as QueryOptions)
      .populate({
        path: 'person',
      })
      .populate({
        path: 'company',
      })
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit);

    const [items, totalItems] = await Promise.all([
      mongoQuery.exec(),
      this.speakerModel.countDocuments(q).exec(),
    ]);

    const data: SpeakerDto[] = items.map((d) => toDto(d, SpeakerDto));
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));

    return {
      data,
      totalItems,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string, includeDeleted = false): Promise<SpeakerDto> {
    const filter: any = { _id: id };
    if (!includeDeleted) {
      filter.entityStatus = { $ne: EntityStatus.DELETED };
    }

    const speaker = await this.speakerModel
      .findOne(filter)
      .populate([{ path: 'person' }, { path: 'company' }])
      .exec();

    if (!speaker) {
      throw new NotFoundException(`No se encontró el orador con ID ${id}`);
    }

    return toDto(speaker, SpeakerDto);
  }

  async update(
    id: string,
    dto: UpdateSpeakerDto,
    updatedBy?: string,
  ): Promise<SpeakerDto> {
    try {
      const { firstName, lastName, email, phone, ...speakerDto } = dto;

      const $set = sanitizeDefined({
        ...speakerDto,
        companyId: dto.companyId ? toObjectId(dto.companyId) : undefined,
        updatedBy: updatedBy ? toObjectId(updatedBy) : undefined,
      });

      const speakerFound = await this.speakerModel
        .findOneAndUpdate(
          { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
          { $set, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true, context: 'query' },
        )
        .populate([{ path: 'person' }, { path: 'company' }])
        .exec();

      if (!speakerFound)
        throw new NotFoundException(`No se encontró el orador con ID ${id}`);

      const hasPersonPatch =
        firstName !== undefined ||
        lastName !== undefined ||
        email !== undefined ||
        phone !== undefined;

      if (hasPersonPatch && speakerFound.personId) {
        const personSet = sanitizeDefined({
          firstName,
          lastName,
          email,
          phone,
          updatedBy: updatedBy ? toObjectId(updatedBy) : undefined,
        });

        await this.personsService.update(
          speakerFound.personId.toString(),
          personSet,
        );
      }

      const updated = await this.speakerModel
        .findById(id)
        .populate([{ path: 'person' }, { path: 'company' }])
        .exec();

      return toDto(updated!, SpeakerDto);
    } catch (error) {
      throw error;
    }
  }

  async changeStatus(
    id: string,
    entityStatus: EntityStatus,
    changedBy?: string,
  ): Promise<SpeakerDto> {
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

    const doc = await this.speakerModel
      .findOneAndUpdate({ _id: id }, update, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .populate([{ path: 'person' }, { path: 'company' }])
      .exec();

    if (!doc)
      throw new NotFoundException(`No se encontró el orador con ID ${id}`);
    return toDto(doc, SpeakerDto);
  }

  async softDelete(id: string, deletedBy?: string): Promise<SpeakerDto> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }
}
