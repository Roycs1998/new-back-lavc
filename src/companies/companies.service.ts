import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, SortOrder, Types } from 'mongoose';

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

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private async ensureEmailIsAvailable(
    email: string,
    excludeId?: Types.ObjectId,
  ): Promise<void> {
    const where: Record<string, any> = {
      contactEmail: this.normalizeEmail(email),
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
      const contactEmail = this.normalizeEmail(dto.contactEmail);
      const name = dto.name?.trim();

      if (contactEmail) {
        await this.ensureEmailIsAvailable(contactEmail);
      }

      const payload = {
        ...dto,
        name,
        contactEmail,
        entityStatus: EntityStatus.ACTIVE,
      };

      const created = await this.companyModel.create(payload);
      return toDto(created, CompanyDto);
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message ?? 'No se pudo crear la empresa',
      );
    }
  }

  private isValidDate(input?: unknown): input is string {
    if (typeof input !== 'string') return false;
    const d = new Date(input);
    return !Number.isNaN(d.getTime());
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
      city,
      search,
      createdFrom,
      createdTo,
      entityStatus,
    } = (filter ?? {}) as any;

    const q: Record<string, any> = {};

    if (entityStatus) {
      q.entityStatus = entityStatus;
    } else {
      q.entityStatus = { $ne: EntityStatus.DELETED };
    }

    if (type) q.type = type;

    if (country) q['address.country'] = this.iRegex(String(country));
    if (city) q['address.city'] = this.iRegex(String(city));

    if (typeof search === 'string' && search.trim()) {
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

    if (this.isValidDate(createdFrom) || this.isValidDate(createdTo)) {
      q.createdAt = {};
      if (this.isValidDate(createdFrom))
        q.createdAt.$gte = new Date(createdFrom!);
      if (this.isValidDate(createdTo)) q.createdAt.$lte = new Date(createdTo!);
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

      const nextEmail = this.normalizeEmail(dto.contactEmail ?? '');

      if (
        nextEmail &&
        nextEmail !== this.normalizeEmail(existing.contactEmail as any)
      ) {
        await this.ensureEmailIsAvailable(nextEmail, _id);
      }

      const $set: Record<string, any> = {
        ...dto,
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.contactEmail ? { contactEmail: nextEmail } : {}),
      };

      const updated = await this.companyModel
        .findOneAndUpdate(
          { _id, entityStatus: { $ne: EntityStatus.DELETED } },
          { $set },
          { new: true, runValidators: true, context: 'query' },
        )
        .exec();

      if (!updated) {
        throw new NotFoundException('Empresa no encontrada');
      }

      return toDto(updated, CompanyDto);
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message ?? 'No se pudo actualizar la empresa',
      );
    }
  }

  async changeStatus(
    id: string,
    status: EntityStatus,
    changedBy?: string,
  ): Promise<CompanyDto> {
    const _id = toObjectId(id);

    const match: Record<string, any> = { _id };
    if (status === EntityStatus.DELETED) {
      match.entityStatus = { $ne: EntityStatus.DELETED };
    }

    const update: any = {
      $set: {
        entityStatus: status,
        ...(changedBy ? { updatedBy: toObjectId(changedBy) } : {}),
      },
      $currentDate: { updatedAt: true as true },
    };

    if (status === EntityStatus.DELETED) {
      if (changedBy) update.$set.deletedBy = toObjectId(changedBy);
      update.$currentDate.deletedAt = true as true; // registra fecha/hora de eliminación
    } else {
      update.$unset = { deletedAt: '', deletedBy: '' };
    }

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
}
