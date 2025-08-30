import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Speaker, SpeakerDocument } from './entities/speaker.entity';
import { Model, PipelineStage } from 'mongoose';
import { PersonsService } from 'src/persons/persons.service';
import { CompaniesService } from 'src/companies/companies.service';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { CreateSpeakerWithPersonDto } from 'src/persons/dto/create-speaker-with-person.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { UserRole } from 'src/common/enums/user-role.enum';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { PersonDocument } from 'src/persons/entities/person.entity';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { toObjectId } from 'src/utils/toObjectId';
import { sanitizeDefined } from 'src/utils/sanitizeDefined';
import { PersonDto } from 'src/persons/dto/person.dto';

export interface CompanySpeakerStats {
  totalSpeakers: number;
  activeSpeakers: number;
  availableSpeakers: number;
  avgExperience: number;
  avgHourlyRate: number;
  uploadMethods: string[];
  topSpecialties: { specialty: string; count: number }[];
}

const aggregationLookups: PipelineStage[] = [
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
  { $unwind: '$company' },
  {
    $lookup: {
      from: 'users',
      localField: 'createdBy',
      foreignField: '_id',
      as: 'creator',
    },
  },
  { $addFields: { creator: { $arrayElemAt: ['$creator', 0] } } },
];

@Injectable()
export class SpeakersService {
  constructor(
    @InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>,
    @Inject(forwardRef(() => PersonsService))
    private personsService: PersonsService,
    @Inject(forwardRef(() => CompaniesService))
    private companiesService: CompaniesService,
  ) {}

  async create(
    dto: CreateSpeakerDto,
    createdBy?: string,
  ): Promise<SpeakerDocument> {
    const company = await this.companiesService.findOne(dto.companyId);
    if (company.entityStatus !== EntityStatus.ACTIVE)
      throw new BadRequestException('Company is not active');

    const doc = new this.speakerModel({
      ...dto,
      personId: toObjectId(dto.personId),
      companyId: toObjectId(dto.companyId),
      entityStatus: EntityStatus.ACTIVE,
      createdBy: createdBy ? toObjectId(createdBy) : undefined,
    });

    return doc.save();
  }

  async createSpeakerWithPerson(
    dto: CreateSpeakerWithPersonDto,
    createdBy?: string,
  ): Promise<{ speaker: SpeakerDocument; person: PersonDto }> {
    const company = await this.companiesService.findOne(dto.companyId);
    if (company.entityStatus !== EntityStatus.ACTIVE)
      throw new BadRequestException('Company is not active');

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
        currency: dto.currency ?? 'PEN',
        socialMedia: dto.socialMedia,
        languages: dto.languages,
        topics: dto.topics,
        audienceSize: dto.audienceSize,
        notes: dto.notes,
        uploadedVia: 'manual',
      },
      createdBy,
    );

    const populated = await this.speakerModel
      .findById(speaker._id)
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail status')
      .populate('createdBy', 'email role')
      .populate('updatedBy', 'email role')
      .populate('editableBy', 'email role')
      .exec();

    if (!populated)
      throw new NotFoundException('Speaker not found after creation');

    return { speaker: populated, person };
  }

  async findAll(
    filter: SpeakerFilterDto,
    requestingUser?: CurrentUserData,
  ): Promise<PaginationMetaDto<any>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      entityStatus,
      companyId,
      specialty,
      minExperience,
      maxExperience,
      language,
      topic,
      currency,
      minRate,
      maxRate,
      uploadedVia,
      search,
      createdFrom,
      createdTo,
    } = filter;

    const skip = (page - 1) * limit;

    const match: Record<string, any> = {
      entityStatus: entityStatus || EntityStatus.ACTIVE,
    };

    if (
      requestingUser?.role === UserRole.COMPANY_ADMIN &&
      requestingUser.companyId
    ) {
      match.companyId = toObjectId(requestingUser.companyId);
    } else if (companyId) {
      match.companyId = toObjectId(companyId);
    }

    if (specialty) match.specialty = { $regex: specialty, $options: 'i' };

    if (minExperience !== undefined || maxExperience !== undefined) {
      match.yearsExperience = {};
      if (minExperience !== undefined)
        match.yearsExperience.$gte = minExperience;
      if (maxExperience !== undefined)
        match.yearsExperience.$lte = maxExperience;
    }

    if (minRate !== undefined || maxRate !== undefined) {
      match.hourlyRate = {};
      if (minRate !== undefined) match.hourlyRate.$gte = minRate;
      if (maxRate !== undefined) match.hourlyRate.$lte = maxRate;
    }

    if (currency) match.currency = currency;
    if (uploadedVia) match.uploadedVia = uploadedVia;
    if (language) match.languages = { $regex: language, $options: 'i' };
    if (topic) match.topics = { $regex: topic, $options: 'i' };

    if (createdFrom || createdTo) {
      match.createdAt = {};
      if (createdFrom) match.createdAt.$gte = new Date(createdFrom);
      if (createdTo) match.createdAt.$lte = new Date(createdTo);
    }

    if (search) {
      match.$or = [
        { 'person.firstName': { $regex: search, $options: 'i' } },
        { 'person.lastName': { $regex: search, $options: 'i' } },
        { 'person.email': { $regex: search, $options: 'i' } },
        { specialty: { $regex: search, $options: 'i' } },
        { biography: { $regex: search, $options: 'i' } },
        { topics: { $elemMatch: { $regex: search, $options: 'i' } } },
        { languages: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    const sortStage: PipelineStage.Sort = {
      $sort: { [sort || 'createdAt']: order === 'asc' ? 1 : -1 },
    };

    const pipeline: PipelineStage[] = [
      ...aggregationLookups,
      { $match: match },
      sortStage,
    ];

    const [data, totalAgg] = await Promise.all([
      this.speakerModel
        .aggregate([...pipeline, { $skip: skip }, { $limit: limit }])
        .exec(),
      this.speakerModel.aggregate([...pipeline, { $count: 'total' }]).exec(),
    ]);

    const totalItems = totalAgg[0]?.total ?? 0;
    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      totalItems,
      totalPages,
      currentPage: page,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(
    id: string,
    includeDeleted = false,
    requestingUser?: any,
  ): Promise<Speaker> {
    const filter: any = { _id: id };
    if (!includeDeleted) {
      filter.entityStatus = { $ne: EntityStatus.DELETED };
    }

    const speaker = await this.speakerModel
      .findOne(filter)
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail status')
      .populate('createdBy', 'email role')
      .populate('updatedBy', 'email role')
      .populate('editableBy', 'email role')
      .exec();

    if (!speaker) {
      throw new NotFoundException(`Speaker with ID ${id} not found`);
    }

    if (
      requestingUser?.role === UserRole.COMPANY_ADMIN &&
      requestingUser?.companyId
    ) {
      if (speaker.companyId._id.toString() !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Access denied. Speaker belongs to different company.',
        );
      }
    }

    return speaker;
  }

  async findByCompany(
    companyId: string,
    includeInactive = false,
    requestingUser?: any,
  ): Promise<SpeakerDocument[]> {
    if (
      requestingUser?.role === UserRole.COMPANY_ADMIN &&
      requestingUser.companyId
    ) {
      if (companyId !== requestingUser.companyId) {
        throw new ForbiddenException('Access denied. Your company only.');
      }
    }

    const filter: Record<string, any> = { companyId: toObjectId(companyId) };
    filter.entityStatus = includeInactive
      ? { $ne: EntityStatus.DELETED }
      : EntityStatus.ACTIVE;

    return this.speakerModel
      .find(filter)
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .populate('createdBy', 'email role')
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    dto: UpdateSpeakerDto,
    updatedBy?: string,
  ): Promise<SpeakerDocument> {
    try {
      const $set = sanitizeDefined({
        ...dto,
        companyId: dto.companyId ? toObjectId(dto.companyId) : undefined,
        updatedBy: updatedBy ? toObjectId(updatedBy) : undefined,
      });

      const updated = await this.speakerModel
        .findOneAndUpdate(
          { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
          { $set, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true, context: 'query' },
        )
        .populate('personId', 'firstName lastName email phone')
        .populate('companyId', 'name contactEmail')
        .populate('createdBy', 'email role')
        .populate('updatedBy', 'email role')
        .exec();

      if (!updated)
        throw new NotFoundException(`Speaker with ID ${id} not found`);

      return updated;
    } catch (error) {
      throw error;
    }
  }

  async changeStatus(
    id: string,
    entityStatus: EntityStatus,
    changedBy?: string,
  ): Promise<SpeakerDocument> {
    const $set: Record<string, any> = {
      entityStatus,
      updatedBy: changedBy ? toObjectId(changedBy) : undefined,
    };

    if (entityStatus === EntityStatus.DELETED) {
      $set.deletedAt = new Date();
      if (changedBy) $set.deletedBy = toObjectId(changedBy);
    } else {
      $set.deletedAt = undefined;
      $set.deletedBy = undefined;
    }

    const doc = await this.speakerModel
      .findOneAndUpdate(
        { _id: id },
        { $set, $currentDate: { updatedAt: true } },
        { new: true },
      )
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .populate('createdBy', 'email role')
      .populate('updatedBy', 'email role')
      .exec();

    if (!doc) throw new NotFoundException(`Speaker with ID ${id} not found`);
    return doc;
  }

  async softDelete(id: string, deletedBy?: string): Promise<SpeakerDocument> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }

  async addEditableUser(
    speakerId: string,
    userId: string,
    requestedBy?: string,
  ): Promise<SpeakerDocument> {
    const update = sanitizeDefined({
      $addToSet: { editableBy: toObjectId(userId) },
      updatedBy: requestedBy ? toObjectId(requestedBy) : undefined,
    });

    const doc = await this.speakerModel
      .findByIdAndUpdate(
        speakerId,
        { ...update, $currentDate: { updatedAt: true } },
        { new: true },
      )
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .populate('editableBy', 'email role')
      .exec();

    if (!doc)
      throw new NotFoundException(`Speaker with ID ${speakerId} not found`);
    return doc;
  }

  async removeEditableUser(
    speakerId: string,
    userId: string,
    requestedBy?: string,
  ): Promise<SpeakerDocument> {
    const update: Record<string, any> = {
      $pull: { editableBy: toObjectId(userId) },
      $currentDate: { updatedAt: true },
    };
    if (requestedBy) update.$set = { updatedBy: toObjectId(requestedBy) };

    const doc = await this.speakerModel
      .findByIdAndUpdate(speakerId, update, { new: true })
      .populate('personId', 'firstName lastName email phone')
      .populate('companyId', 'name contactEmail')
      .populate('editableBy', 'email role')
      .exec();

    if (!doc)
      throw new NotFoundException(`Speaker with ID ${speakerId} not found`);
    return doc;
  }

  async getCompanyStats(companyId: string): Promise<CompanySpeakerStats> {
    const companyObjId = toObjectId(companyId);

    const [stats] = await this.speakerModel
      .aggregate([
        {
          $match: {
            companyId: companyObjId,
            entityStatus: { $ne: EntityStatus.DELETED },
          },
        },
        {
          $group: {
            _id: null,
            totalSpeakers: { $sum: 1 },
            activeSpeakers: {
              $sum: {
                $cond: [{ $eq: ['$entityStatus', EntityStatus.ACTIVE] }, 1, 0],
              },
            },
            availableSpeakers: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ['$entityStatus', EntityStatus.ACTIVE] },
                      { $eq: ['$isAvailable', true] },
                    ],
                  },
                  1,
                  0,
                ],
              },
            },
            avgExperience: { $avg: '$yearsExperience' },
            avgHourlyRate: { $avg: '$hourlyRate' },
            uploadMethods: { $push: '$uploadedVia' },
          },
        },
        {
          $project: {
            _id: 0,
            totalSpeakers: 1,
            activeSpeakers: 1,
            availableSpeakers: 1,
            avgExperience: { $round: ['$avgExperience', 1] },
            avgHourlyRate: { $round: ['$avgHourlyRate', 2] },
            uploadMethods: 1,
          },
        },
      ])
      .exec();

    const top = await this.speakerModel
      .aggregate([
        {
          $match: {
            companyId: companyObjId,
            entityStatus: EntityStatus.ACTIVE,
          },
        },
        { $group: { _id: '$specialty', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])
      .exec();

    return {
      totalSpeakers: stats?.totalSpeakers ?? 0,
      activeSpeakers: stats?.activeSpeakers ?? 0,
      availableSpeakers: stats?.availableSpeakers ?? 0,
      avgExperience: stats?.avgExperience ?? 0,
      avgHourlyRate: stats?.avgHourlyRate ?? 0,
      uploadMethods: stats?.uploadMethods ?? [],
      topSpecialties: top.map((t) => ({ specialty: t._id, count: t.count })),
    };
  }
}
