import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, SortOrder, Types } from 'mongoose';

import { CompanyType } from 'src/common/enums/company-type.enum';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { CompanyFilterDto } from './dto/company-filter.dto';

import { Company, CompanyDocument } from './entities/company.entity';
import { sanitizeFlat } from 'src/utils/sanitizeFlat';
import { escapeRegex } from 'src/utils/escapeRegex';
import { asDate } from 'src/utils/asDate';
import { normalizeEmail } from 'src/utils/normalizeEmail';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
  ) {}

  async create(dto: CreateCompanyDto): Promise<CompanyDocument> {
    try {
      dto.contactEmail = normalizeEmail(dto.contactEmail);
      const doc = new this.companyModel(dto);
      return await doc.save();
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('Contact email already exists');
      }
      throw error;
    }
  }

  async findAll(
    filterDto: CompanyFilterDto,
  ): Promise<PaginationMetaDto<CompanyDocument>> {
    const {
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc',
      search,
      entityStatus,
      type,
      country,
      city,
      createdFrom,
      createdTo,
    } = filterDto ?? {};

    const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, any> = {};

    if (entityStatus) filter.entityStatus = entityStatus;
    else filter.entityStatus = { $ne: EntityStatus.DELETED };

    if (type) filter.type = type as CompanyType;

    if (country?.trim()) {
      filter['address.country'] = {
        $regex: `^${escapeRegex(country.trim())}$`,
        $options: 'i',
      };
    }
    if (city?.trim()) {
      filter['address.city'] = {
        $regex: `^${escapeRegex(city.trim())}$`,
        $options: 'i',
      };
    }

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
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { contactEmail: { $regex: q, $options: 'i' } },
      ];
    }

    const SORT_WHITELIST = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'contactEmail',
      'type',
      'entityStatus',
      'commissionRate',
      'approvedAt',
    ] as const);
    const sortKey = SORT_WHITELIST.has(sort as any) ? sort : 'createdAt';
    const sortOptions: Record<string, SortOrder> = {
      [sortKey]: order === 'asc' ? 1 : -1,
    };

    const [data, totalItems] = await Promise.all([
      this.companyModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.companyModel.countDocuments(filter),
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

  async findOne(id: string, includeDeleted = false): Promise<CompanyDocument> {
    const query: any = { _id: id };
    if (!includeDeleted) query.entityStatus = { $ne: EntityStatus.DELETED };

    const company = await this.companyModel.findOne(query).exec();
    if (!company)
      throw new NotFoundException(`Company with ID ${id} not found`);
    return company;
  }

  async findByContactEmail(
    contactEmail: string,
  ): Promise<CompanyDocument | null> {
    return this.companyModel
      .findOne({ contactEmail: normalizeEmail(contactEmail) })
      .exec();
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyDocument> {
    try {
      if (dto.contactEmail) dto.contactEmail = normalizeEmail(dto.contactEmail);

      const existing = await this.companyModel
        .findOne({ _id: id, entityStatus: { $ne: EntityStatus.DELETED } })
        .lean();
      if (!existing) throw new NotFoundException('Company not found');

      if (dto.contactEmail && dto.contactEmail !== existing.contactEmail) {
        const dup = await this.companyModel.exists({
          _id: { $ne: id },
          contactEmail: dto.contactEmail,
          entityStatus: { $ne: EntityStatus.DELETED },
        });
        if (dup) throw new ConflictException('Contact email already exists');
      }

      const $set = sanitizeFlat(dto);
      if (Object.keys($set).length === 0) {
        const doc = await this.companyModel.findById(id).exec();
        if (!doc) throw new NotFoundException('Company not found');
        return doc;
      }

      const updated = await this.companyModel
        .findOneAndUpdate(
          { _id: id, entityStatus: { $ne: EntityStatus.DELETED } },
          { $set, $currentDate: { updatedAt: true } },
          { new: true, runValidators: true, context: 'query' },
        )
        .exec();

      if (!updated) throw new NotFoundException('Company not found');
      return updated;
    } catch (error: any) {
      if (error?.code === 11000) {
        throw new BadRequestException('Contact email already exists');
      }
      throw error;
    }
  }

  async changeStatus(
    id: string,
    entityStatus: EntityStatus,
    changedBy?: string,
  ): Promise<CompanyDocument> {
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

    const doc = await this.companyModel
      .findOneAndUpdate({ _id: id }, update, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .exec();

    if (!doc) throw new NotFoundException('Company not found');
    return doc;
  }

  async softDelete(id: string, deletedBy?: string): Promise<CompanyDocument> {
    return this.changeStatus(id, EntityStatus.DELETED, deletedBy);
  }
}
