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
  UpdateQuery,
} from 'mongoose';
import { UsersService } from 'src/users/users.service';
import { StorageService } from 'src/storage/storage.service';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { CreateSpeakerWithUserDto } from './dto/create-speaker-with-user.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { toObjectId } from 'src/utils/toObjectId';
import { sanitizeDefined } from 'src/utils/sanitizeDefined';
import { SpeakerDto } from './dto/speaker.dto';
import { SpeakerPaginatedDto } from './dto/speaker-pagination.dto';
import { toDto } from 'src/utils/toDto';
import { extractKeyFromUrl } from 'src/utils/extractKeyFromUrl';
import { UpdateUserDto } from 'src/users/dto/update-user.dto';
import { UserDocument } from 'src/users/entities/user.entity';

@Injectable()
export class SpeakersService {
  constructor(
    @InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private storageService: StorageService,
  ) {}

  private escapeRegex(input: string): string {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  async create(dto: CreateSpeakerDto, createdBy?: string): Promise<SpeakerDto> {
    const doc = await this.speakerModel.create({
      ...dto,
      userId: toObjectId(dto.userId),
      entityStatus: EntityStatus.ACTIVE,
      createdBy: createdBy ? toObjectId(createdBy) : undefined,
    });

    const populated = await this.speakerModel
      .findById(doc._id)
      .populate('user')
      .exec();

    if (!populated) {
      throw new NotFoundException(
        'Orador no encontrado después de la creación',
      );
    }

    return toDto(populated, SpeakerDto);
  }

  async createSpeakerWithUser(
    dto: CreateSpeakerWithUserDto,
    createdBy?: string,
  ): Promise<SpeakerDto> {
    const user = await this.usersService.create(dto);

    return this.create(
      {
        userId: user.id,
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
  }

  async findAll(filter: SpeakerFilterDto): Promise<SpeakerPaginatedDto> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
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

    const q: FilterQuery<SpeakerDocument> = {};

    if (entityStatus) {
      q.entityStatus = entityStatus;
    } else {
      q.entityStatus = { $ne: EntityStatus.DELETED };
    }

    if (!includeDeleted) {
      q.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
    }

    if (search?.trim()) {
      q.$text = { $search: search.trim() };
    }

    if (specialty?.trim()) {
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

    const projection: ProjectionType<SpeakerDocument> = {};

    const mongoQuery = this.speakerModel
      .find(q, projection, {
        collation: { locale: 'es', strength: 2 },
      } as QueryOptions)
      .populate('user')
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
      currentPage: safePage(page),
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async findOne(id: string, includeDeleted = false): Promise<SpeakerDto> {
    const filter: FilterQuery<SpeakerDocument> = { _id: toObjectId(id) };
    if (!includeDeleted) {
      filter.entityStatus = { $ne: EntityStatus.DELETED };
    }

    const speaker = await this.speakerModel
      .findOne(filter)
      .populate('user')
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

      const $set: UpdateQuery<SpeakerDocument> = sanitizeDefined({
        ...speakerDto,
        updatedBy: updatedBy ? toObjectId(updatedBy) : undefined,
      });

      const speakerFound = await this.speakerModel
        .findOneAndUpdate(
          { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
          { $set, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true, context: 'query' },
        )
        .populate('user')
        .exec();

      if (!speakerFound)
        throw new NotFoundException(`No se encontró el orador con ID ${id}`);

      const hasUserPatch =
        firstName !== undefined ||
        lastName !== undefined ||
        email !== undefined ||
        phone !== undefined;

      if (hasUserPatch && speakerFound.userId) {
        const userSet: UpdateUserDto = sanitizeDefined({
          firstName,
          lastName,
          email,
          phone,
        });

        await this.usersService.update(speakerFound.userId.toString(), userSet);
      }

      if (hasUserPatch) {
        const updated = await this.speakerModel
          .findById(id)
          .populate('user')
          .exec();
        return toDto(updated!, SpeakerDto);
      }

      return toDto(speakerFound, SpeakerDto);
    } catch (error) {
      throw error;
    }
  }

  async changeStatus(
    id: string,
    entityStatus: EntityStatus,
    changedBy?: string,
  ): Promise<SpeakerDto> {
    const update: UpdateQuery<SpeakerDocument> = {
      $set: {
        entityStatus,
        ...(changedBy && entityStatus === EntityStatus.DELETED
          ? { deletedBy: toObjectId(changedBy) }
          : {}),
      },
      $currentDate: {
        updatedAt: true as const,
        ...(entityStatus === EntityStatus.DELETED
          ? { deletedAt: true as const }
          : {}),
      },
      ...(entityStatus !== EntityStatus.DELETED
        ? { $unset: { deletedAt: '', deletedBy: '' } }
        : {}),
    };

    const doc = await this.speakerModel
      .findOneAndUpdate({ _id: id }, update, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .populate('user')
      .exec();

    if (!doc)
      throw new NotFoundException(`No se encontró el orador con ID ${id}`);
    return toDto(doc, SpeakerDto);
  }

  async softDelete(id: string, deletedBy?: string): Promise<SpeakerDto> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }

  async updateSpeakerPhoto(
    id: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<SpeakerDto> {
    const speakerDoc = await this.speakerModel
      .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
      .populate<{ user: UserDocument }>('user')
      .exec();

    if (!speakerDoc) {
      throw new NotFoundException(`No se encontró el orador con ID ${id}`);
    }

    if (!speakerDoc.userId) {
      throw new BadRequestException('El speaker no tiene un usuario asociado');
    }

    const oldAvatarUrl = speakerDoc.user?.avatar;

    const fileInfo = await this.storageService.uploadSpeakerPhoto(
      buffer,
      originalName,
      mimeType,
    );

    await this.usersService.update(speakerDoc.userId.toString(), {
      avatar: fileInfo.publicUrl,
    });

    if (oldAvatarUrl && oldAvatarUrl !== fileInfo.publicUrl) {
      const oldKey = extractKeyFromUrl(oldAvatarUrl);
      if (oldKey) {
        try {
          await this.storageService.deleteFile(oldKey);
        } catch (error) {
          console.error(`Failed to delete old avatar: ${oldKey}`, error);
        }
      }
    }

    return this.findOne(id);
  }

  async deleteSpeakerPhoto(id: string): Promise<SpeakerDto> {
    const speakerDoc = await this.speakerModel
      .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
      .populate<{ user: UserDocument }>('user')
      .exec();

    if (!speakerDoc) {
      throw new NotFoundException(`No se encontró el orador con ID ${id}`);
    }

    if (!speakerDoc.userId) {
      throw new BadRequestException('El speaker no tiene un usuario asociado');
    }

    const avatarUrl = speakerDoc.user?.avatar;

    if (!avatarUrl) {
      throw new BadRequestException('El speaker no tiene una foto asignada');
    }

    const avatarKey = extractKeyFromUrl(avatarUrl);
    if (avatarKey) {
      try {
        await this.storageService.deleteFile(avatarKey);
      } catch (error) {
        console.error(`Failed to delete avatar: ${avatarKey}`, error);
      }
    }

    await this.usersService.update(speakerDoc.userId.toString(), {
      avatar: undefined,
    });

    return this.findOne(id);
  }
}

function safePage(page: number): number {
  return Math.max(1, Number(page));
}
