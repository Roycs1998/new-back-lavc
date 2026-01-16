import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, SortOrder, Types, UpdateQuery } from 'mongoose';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyFilterDto } from './dto/company-filter.dto';
import { Company, CompanyDocument } from './entities/company.entity';
import { escapeRegex } from 'src/utils/escapeRegex';
import { CompanyDto } from './dto/company.dto';
import { CompanyPaginatedDto } from './dto/company-pagination.dto';
import { toObjectId } from 'src/utils/toObjectId';
import { toDto } from 'src/utils/toDto';
import { StorageService } from 'src/storage/storage.service';
import { extractKeyFromUrl } from 'src/utils/extractKeyFromUrl';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    private storageService: StorageService,
  ) {}

  private async ensureEmailIsAvailable(
    email: string,
    excludeId?: Types.ObjectId,
  ): Promise<void> {
    const where: FilterQuery<CompanyDocument> = {
      contactEmail: email.toLowerCase(),
      entityStatus: { $ne: EntityStatus.DELETED },
    };
    if (excludeId) where._id = { $ne: excludeId };

    const exists = await this.companyModel.exists(where).lean();
    if (exists) {
      throw new ConflictException(
        'Ya existe una empresa registrada con este correo electrónico',
      );
    }
  }

  async create(dto: CreateCompanyDto): Promise<CompanyDto> {
    try {
      if (dto.contactEmail) {
        await this.ensureEmailIsAvailable(dto.contactEmail);
      }

      const payload = {
        ...dto,
        entityStatus: EntityStatus.ACTIVE,
      };

      const created = await this.companyModel.create(payload);
      return toDto(created, CompanyDto);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'No se pudo crear la empresa';
      throw new InternalServerErrorException(message);
    }
  }

  private iRegex(term: string) {
    return { $regex: escapeRegex(term), $options: 'i' as const };
  }

  async findAll(filter: CompanyFilterDto): Promise<CompanyPaginatedDto> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      type,
      country,
      countryCode,
      city,
      search,
      createdFrom,
      createdTo,
      entityStatus,
    } = filter;

    const q: FilterQuery<CompanyDocument> = {};

    if (entityStatus) {
      q.entityStatus = entityStatus;
    } else {
      q.entityStatus = { $ne: EntityStatus.DELETED };
    }

    if (type) q.type = type;

    if (countryCode) q['address.countryCode'] = countryCode;

    if (country) q['address.country'] = this.iRegex(country);

    if (city) q['address.city'] = this.iRegex(city);

    if (search?.trim()) {
      const term = search.trim();
      const rx = this.iRegex(term);
      q.$or = [
        { name: rx },
        { description: rx },
        { contactName: rx },
        { contactEmail: rx },
        { contactPhone: rx },
        { 'address.city': rx },
        { 'address.country': rx },
      ];
    }

    if (createdFrom || createdTo) {
      q.createdAt = {};
      if (createdFrom) q.createdAt.$gte = new Date(createdFrom);
      if (createdTo) q.createdAt.$lte = new Date(createdTo);
    }

    const perPage = Math.min(100, Math.max(1, Number(limit)));
    const safePage = Math.max(1, Number(page));
    const skip = (safePage - 1) * perPage;

    const sortKey = ['name', 'type', 'createdAt', 'updatedAt'].includes(
      String(sort),
    )
      ? String(sort)
      : 'createdAt';
    const sortSpec: Record<string, SortOrder> = {
      [sortKey]: order === 'asc' ? 1 : -1,
    };

    const [docs, totalItems] = await Promise.all([
      this.companyModel.find(q).sort(sortSpec).skip(skip).limit(perPage).exec(),
      this.companyModel.countDocuments(q).exec(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / perPage));

    return {
      data: docs.map((d) => toDto(d, CompanyDto)),
      totalItems,
      totalPages,
      currentPage: safePage,
      hasNextPage: safePage < totalPages,
      hasPreviousPage: safePage > 1,
    };
  }

  async findOne(id: string): Promise<CompanyDto> {
    const _id = toObjectId(id);
    const doc = await this.companyModel
      .findOne({ _id, entityStatus: { $ne: EntityStatus.DELETED } })
      .exec();

    if (!doc) throw new NotFoundException('Empresa no encontrada');
    return toDto(doc, CompanyDto);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyDto> {
    try {
      const _id = toObjectId(id);

      const existing = await this.companyModel
        .findOne({ _id, entityStatus: { $ne: EntityStatus.DELETED } })
        .select({ _id: 1, contactEmail: 1 })
        .exec();

      if (!existing) {
        throw new NotFoundException('Empresa no encontrada');
      }

      if (dto.contactEmail && dto.contactEmail !== existing.contactEmail) {
        await this.ensureEmailIsAvailable(dto.contactEmail, _id);
      }

      const updated = await this.companyModel
        .findOneAndUpdate(
          { _id, entityStatus: { $ne: EntityStatus.DELETED } },
          { $set: dto },
          { new: true, runValidators: true, context: 'query' },
        )
        .exec();

      if (!updated) {
        throw new NotFoundException('Empresa no encontrada');
      }

      return toDto(updated, CompanyDto);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo actualizar la empresa';
      throw new InternalServerErrorException(message);
    }
  }

  async changeStatus(
    id: string,
    status: EntityStatus,
    changedBy?: string,
  ): Promise<CompanyDto> {
    const _id = toObjectId(id);

    const match: FilterQuery<CompanyDocument> = { _id };
    if (status === EntityStatus.DELETED) {
      match.entityStatus = { $ne: EntityStatus.DELETED };
    }

    const update: UpdateQuery<CompanyDocument> = {
      $set: {
        entityStatus: status,
        ...(changedBy ? { updatedBy: toObjectId(changedBy) } : {}),
        ...(status === EntityStatus.DELETED && changedBy
          ? { deletedBy: toObjectId(changedBy) }
          : {}),
      },
      $currentDate: {
        updatedAt: true as const,
        ...(status === EntityStatus.DELETED
          ? { deletedAt: true as const }
          : {}),
      },
      ...(status !== EntityStatus.DELETED
        ? { $unset: { deletedAt: '', deletedBy: '' } }
        : {}),
    };

    const doc = await this.companyModel
      .findOneAndUpdate(match, update, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .exec();

    if (!doc) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return toDto(doc, CompanyDto);
  }

  async softDelete(id: string, deletedBy?: string): Promise<CompanyDto> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }

  async updateCompanyLogo(
    id: string,
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<CompanyDto> {
    const companyDoc = await this.companyModel
      .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
      .exec();

    if (!companyDoc) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const company = toDto(companyDoc, CompanyDto);
    const oldLogoUrl = company.logo;

    const fileInfo = await this.storageService.uploadCompanyLogo(
      buffer,
      originalName,
      mimeType,
    );

    await this.companyModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        { $set: { logo: fileInfo.publicUrl } },
        { new: true },
      )
      .exec();

    if (oldLogoUrl && oldLogoUrl !== fileInfo.publicUrl) {
      const oldKey = extractKeyFromUrl(oldLogoUrl);
      if (oldKey) {
        try {
          await this.storageService.deleteFile(oldKey);
        } catch (error) {
          console.error(`Failed to delete old logo: ${oldKey}`, error);
        }
      }
    }

    return this.findOne(id);
  }

  async deleteCompanyLogo(id: string): Promise<CompanyDto> {
    const companyDoc = await this.companyModel
      .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
      .exec();

    if (!companyDoc) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const company = toDto(companyDoc, CompanyDto);
    const logoUrl = company.logo;

    if (!logoUrl) {
      throw new NotFoundException('La empresa no tiene un logo asignado');
    }

    const logoKey = extractKeyFromUrl(logoUrl);
    if (logoKey) {
      try {
        await this.storageService.deleteFile(logoKey);
      } catch (error) {
        console.error(`Failed to delete logo: ${logoKey}`, error);
      }
    }

    await this.companyModel
      .findOneAndUpdate(
        { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
        { $unset: { logo: '' } },
        { new: true },
      )
      .exec();

    return this.findOne(id);
  }
}
