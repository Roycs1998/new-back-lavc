import {
  BadRequestException,
  ForbiddenException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { InjectModel } from '@nestjs/mongoose';
import { TicketType, TicketTypeDocument } from './entities/ticket.entity';
import {
  FilterQuery,
  Model,
  PipelineStage,
  ProjectionType,
  QueryOptions,
  Types,
} from 'mongoose';
import { Event, EventDocument } from './entities/event.entity';
import { CompaniesService } from 'src/companies/companies.service';
import { SpeakersService } from 'src/speakers/speakers.service';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import { EventFilterDto } from './dto/event-filter.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { toObjectId } from 'src/utils/toObjectId';
import { EventDto } from './dto/event.dto';
import { toDto } from 'src/utils/toDto';
import { sanitizeDefined } from 'src/utils/sanitizeDefined';
import { escapeRegex } from 'src/utils/escapeRegex';
import { EventPaginatedDto } from './dto/event-pagination.dto';

type SortDir = 1 | -1;

function needsLookup(sortObj: Record<string, SortDir>): boolean {
  return Object.keys(sortObj).some((k) => k.includes('.'));
}

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name)
    private ticketTypeModel: Model<TicketTypeDocument>,
    @Inject(forwardRef(() => CompaniesService))
    private companiesService: CompaniesService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    createdBy: string,
  ): Promise<EventDto> {
    const company = await this.companiesService.findOne(
      createEventDto.companyId,
    );
    if (company.entityStatus !== EntityStatus.ACTIVE) {
      throw new BadRequestException('La empresa no está activa.');
    }

    let slug = createEventDto.slug;
    const companyObjId = toObjectId(createEventDto.companyId);
    if (!slug) {
      slug = await this.generateUniqueSlug(createEventDto.title);
    } else {
      const exists = await this.eventModel.exists({
        companyId: companyObjId,
        slug,
        eventStatus: { $ne: EventStatus.DELETED },
      });
      if (exists)
        throw new BadRequestException('Slug ya existe para esta empresa');
    }

    const startDate = new Date(createEventDto.startDate);
    const endDate = new Date(createEventDto.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }
    if (startDate >= endDate) {
      throw new BadRequestException('End date must be after start date');
    }
    if (startDate < new Date()) {
      throw new BadRequestException('Event cannot start in the past');
    }

    const payload = {
      ...createEventDto,
      companyId: companyObjId,
      slug,
      speakers: (createEventDto.speakers ?? []).map(toObjectId),
      createdBy: toObjectId(createdBy),
      eventStatus: EventStatus.DRAFT,
      startDate,
      endDate,
    };

    const created = await this.eventModel.create(payload);

    const doc = await this.eventModel
      .findById(created._id)
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
        },
      })
      .exec();

    if (!doc) {
      throw new NotFoundException(
        `No se encontró el evento con ID ${created._id}`,
      );
    }

    return toDto(doc!, EventDto);
  }

  private parseSort(
    sortRaw: string | undefined,
    fallbackOrder: any,
  ): Record<string, SortDir> {
    const def: SortDir = fallbackOrder === 'asc' ? 1 : -1;
    if (!sortRaw || !sortRaw.trim()) return { createdAt: -1 };

    const out: Record<string, SortDir> = {};
    for (const raw of sortRaw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)) {
      const hasPrefix = raw.startsWith('+') || raw.startsWith('-');
      const field = hasPrefix ? raw.slice(1) : raw;
      const dir: SortDir = raw.startsWith('-')
        ? -1
        : raw.startsWith('+')
          ? 1
          : def;

      if (!/^[a-zA-Z0-9.]+$/.test(field)) continue;
      out[field] = dir;
    }
    if (Object.keys(out).length === 0) out.createdAt = -1;
    return out;
  }

  async findAll(
    filterDto: EventFilterDto,
    requestingUser?: any,
  ): Promise<EventPaginatedDto> {
    const {
      page = 1,
      limit = 10,
      sort,
      order = 'desc',
      companyId,
      type,
      eventStatus,
      locationType,
      city,
      country,
      startFrom,
      startTo,
      endFrom,
      endTo,
      tags,
      categories,
      speakerId,
      search,
    } = filterDto;

    const skip = (page - 1) * limit;
    const match: FilterQuery<Event> = {};

    if (
      requestingUser?.role === UserRole.COMPANY_ADMIN &&
      requestingUser?.companyId
    ) {
      match.companyId = toObjectId(requestingUser.companyId);
    } else if (companyId) {
      match.companyId = toObjectId(companyId);
    }

    if (eventStatus) {
      match.eventStatus = eventStatus;
      if (eventStatus === EventStatus.DELETED) {
      } else {
        match.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
      }
    } else if (requestingUser?.role === UserRole.USER || !requestingUser) {
      match.eventStatus = {
        $in: [EventStatus.PUBLISHED, EventStatus.COMPLETED],
      };
      match.$or = [{ deletedAt: { $exists: false } }, { deletedAt: null }];
    } else {
      match.eventStatus = { $ne: EventStatus.DELETED };
    }

    if (type) match.type = type;

    if (locationType) match['location.type'] = locationType;

    if (city)
      match['location.address.city'] = {
        $regex: escapeRegex(city),
        $options: 'i',
      };
    if (country)
      match['location.address.country'] = {
        $regex: escapeRegex(country),
        $options: 'i',
      };

    if (startFrom || startTo) {
      match.startDate = {};
      if (startFrom) (match.startDate as any).$gte = new Date(startFrom);
      if (startTo) (match.startDate as any).$lte = new Date(startTo);
    }
    if (endFrom || endTo) {
      match.endDate = {};
      if (endFrom) (match.endDate as any).$gte = new Date(endFrom);
      if (endTo) (match.endDate as any).$lte = new Date(endTo);
    }

    if (Array.isArray(tags) && tags.length) {
      match.tags = { $in: tags };
    }
    if (Array.isArray(categories) && categories.length) {
      match.categories = { $in: categories };
    }

    if (speakerId) match.speakers = toObjectId(speakerId);

    if (search?.trim()) {
      const r = { $regex: escapeRegex(search.trim()), $options: 'i' };
      match.$or = [
        { title: r },
        { description: r },
        { shortDescription: r },
        { tags: r },
        { categories: r },
      ];
    }

    const sortObj = this.parseSort(sort, order);

    if (needsLookup(sortObj)) {
      const pipeline: PipelineStage[] = [
        { $match: match },
        {
          $lookup: {
            from: 'companies',
            localField: 'companyId',
            foreignField: '_id',
            as: 'company',
            pipeline: [
              { $project: { name: 1, contactEmail: 1, contactPhone: 1 } },
            ],
          },
        },
        { $unwind: { path: '$company', preserveNullAndEmptyArrays: true } },
        { $sort: sortObj as any },
        { $skip: skip },
        { $limit: limit },
      ];

      const [items, countAgg] = await Promise.all([
        this.eventModel
          .aggregate(pipeline)
          .collation({ locale: 'es', strength: 2 })
          .exec(),
        this.eventModel
          .aggregate([{ $match: match }, { $count: 'total' }])
          .exec(),
      ]);

      const data = items.map((i) => toDto(i, EventDto));
      const totalItems = countAgg[0]?.total ?? 0;
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

    const projection: ProjectionType<Event> = {};
    const query = this.eventModel
      .find(match, projection, {
        collation: { locale: 'es', strength: 2 },
      } as QueryOptions)
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
        },
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const [items, totalItems] = await Promise.all([
      query.lean().exec(),
      this.eventModel.countDocuments(match).exec(),
    ]);

    const data = items.map((i) => toDto(i, EventDto));
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

  async findOne(id: string, requestingUser?: any): Promise<EventDto> {
    const filter: any = { _id: id };

    const event = await this.eventModel
      .findOne(filter)
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
          select: 'firstName lastName email',
        },
      })
      .exec();

    if (!event) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    if (
      requestingUser?.role === UserRole.COMPANY_ADMIN &&
      requestingUser?.companyId
    ) {
      if (event.companyId._id.toString() !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Acceso denegado. El evento pertenece a otra empresa.',
        );
      }
    }

    if (requestingUser?.role === UserRole.USER || !requestingUser) {
      if (
        ![
          EventStatus.PUBLISHED,
          EventStatus.COMPLETED,
          EventStatus.APPROVED,
        ].includes(event.eventStatus)
      ) {
        throw new ForbiddenException(
          'El evento no está disponible públicamente',
        );
      }
    }

    return toDto(event, EventDto);
  }

  async findBySlug(slug: string): Promise<EventDocument> {
    const event = await this.eventModel
      .findOne({
        slug,
        eventStatus: { $in: [EventStatus.PUBLISHED, EventStatus.COMPLETED] },
      })
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
        },
      })
      .exec();

    if (!event) {
      throw new NotFoundException(`No se encontró el evento con slug '${slug}`);
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    updatedBy: string,
  ): Promise<EventDto> {
    const existing = await this.eventModel.findById(id).exec();
    if (!existing) throw new NotFoundException(`Event with ID ${id} not found`);

    if (updateEventDto.slug && updateEventDto.slug !== existing.slug) {
      const exists = await this.eventModel.exists({
        slug: updateEventDto.slug,
        companyId: existing.companyId,
        _id: { $ne: existing._id },
        eventStatus: { $ne: EventStatus.DELETED },
      });
      if (exists)
        throw new BadRequestException('Slug ya existe para esta empresa');
    }

    const startDate = updateEventDto.startDate
      ? new Date(updateEventDto.startDate)
      : existing.startDate;
    const endDate = updateEventDto.endDate
      ? new Date(updateEventDto.endDate)
      : existing.endDate;
    if (startDate >= endDate) {
      throw new BadRequestException(
        'La fecha de finalización debe ser posterior a la fecha de inicio',
      );
    }

    const $set = sanitizeDefined({
      ...updateEventDto,
      speakers: Array.isArray(updateEventDto.speakers)
        ? updateEventDto.speakers.map(toObjectId)
        : undefined,
      updatedBy: toObjectId(updatedBy),
      updatedAt: new Date(),
    });

    const updated = await this.eventModel
      .findByIdAndUpdate(
        id,
        { $set },
        { new: true, runValidators: true, context: 'query' },
      )
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
        },
      })
      .exec();

    if (!updated)
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);

    return toDto(updated, EventDto);
  }

  async changeEventStatus(
    id: string,
    eventStatus: EventStatus,
    changedBy: string,
    rejectionReason?: string,
  ): Promise<EventDto> {
    const changedById = toObjectId(changedBy);
    const $set: Record<string, any> = {
      eventStatus,
      updatedBy: changedById,
    };
    const $unset: Record<string, ''> = {};

    if (eventStatus === EventStatus.APPROVED) {
      $set.approvedBy = changedById;
      $set.approvedAt = new Date();
      $unset.rejectionReason = '';
    } else if (
      eventStatus === EventStatus.REJECTED ||
      eventStatus == EventStatus.CANCELLED
    ) {
      if (!rejectionReason?.trim()) {
        throw new BadRequestException(
          'Se requiere rejectReason cuando se rechaza un evento',
        );
      }
      $set.rejectionReason = rejectionReason.trim();
      $unset.approvedBy = '';
      $unset.approvedAt = '';
    } else {
      $unset.rejectionReason = '';
    }

    const updateDoc: any = { $set, $currentDate: { updatedAt: true } };
    if (Object.keys($unset).length) updateDoc.$unset = $unset;

    const event = await this.eventModel
      .findByIdAndUpdate(id, updateDoc, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
        },
      })
      .exec();

    if (!event) throw new NotFoundException(`Event with ID ${id} not found`);
    return toDto(event, EventDto);
  }

  async submitForReview(id: string) {
    const event = await this.eventModel.findOne({ _id: id });

    if (!event) throw new NotFoundException('Evento no encontrado');

    if (event.eventStatus !== EventStatus.DRAFT) {
      throw new BadRequestException(
        'Sólo se pueden enviar borradores de eventos',
      );
    }

    if (!event.location?.type)
      throw new BadRequestException('El tipo de ubicación es obligatorio');

    if (event.location.capacity && event.location.capacity < 1)
      throw new BadRequestException('La capacidad debe ser >= 1');

    event.eventStatus = EventStatus.PENDING_APPROVAL;

    event.rejectionReason = undefined;

    return event.save();
  }

  async softDelete(id: string, deletedBy: string): Promise<EventDto> {
    return this.changeEventStatus(id, EventStatus.DELETED, deletedBy);
  }

  async publish(id: string, publishedBy: string): Promise<EventDto> {
    const event = await this.findOne(id);

    if (event.eventStatus !== EventStatus.APPROVED) {
      throw new BadRequestException(
        'El evento debe ser aprobado antes de poder publicarse.',
      );
    }

    return this.changeEventStatus(id, EventStatus.PUBLISHED, publishedBy);
  }

  async cancel(
    id: string,
    cancelledBy: string,
    reason?: string,
  ): Promise<EventDto> {
    return this.changeEventStatus(
      id,
      EventStatus.CANCELLED,
      cancelledBy,
      reason ?? '',
    );
  }

  async createTicketType(
    eventId: string,
    createTicketTypeDto: CreateTicketTypeDto,
    createdBy: string,
  ): Promise<TicketType> {
    try {
      const ticketTypeData = {
        ...createTicketTypeDto,
        eventId: new Types.ObjectId(eventId),
        createdBy: new Types.ObjectId(createdBy),
        ticketStatus: TicketStatus.AVAILABLE,
      };

      const ticketType = new this.ticketTypeModel(ticketTypeData);
      return await ticketType.save();
    } catch (error) {
      throw error;
    }
  }

  async getEventTicketTypes(eventId: string): Promise<TicketTypeDocument[]> {
    return this.ticketTypeModel
      .find({
        eventId: new Types.ObjectId(eventId),
      })
      .populate('createdBy', 'email role')
      .sort({ createdAt: 1 })
      .exec();
  }

  async updateTicketType(
    ticketTypeId: string,
    updateData: any,
    updatedBy: string,
  ): Promise<TicketType> {
    const updateInfo = {
      ...updateData,
      updatedBy: new Types.ObjectId(updatedBy),
      updatedAt: new Date(),
    };

    const ticketType = await this.ticketTypeModel
      .findByIdAndUpdate(ticketTypeId, updateInfo, { new: true })
      .populate('createdBy', 'email role')
      .populate('updatedBy', 'email role')
      .exec();

    if (!ticketType) {
      throw new NotFoundException(
        `Ticket type with ID ${ticketTypeId} not found`,
      );
    }

    return ticketType;
  }

  async deleteTicketType(ticketTypeId: string): Promise<void> {
    const ticketType = await this.ticketTypeModel.findById(ticketTypeId);
    if (!ticketType) {
      throw new NotFoundException(
        `Ticket type with ID ${ticketTypeId} not found`,
      );
    }

    if (ticketType.sold > 0) {
      throw new BadRequestException(
        'Cannot delete ticket type that has already been sold',
      );
    }

    await this.ticketTypeModel.findByIdAndDelete(ticketTypeId);
  }

  async getEventStats(eventId: string): Promise<any> {
    const event = await this.findOne(eventId);

    const ticketStats = await this.ticketTypeModel.aggregate([
      {
        $match: {
          eventId: new Types.ObjectId(eventId),
        },
      },
      {
        $group: {
          _id: null,
          totalCapacity: { $sum: '$quantity' },
          totalSold: { $sum: '$sold' },
          totalRevenue: { $sum: { $multiply: ['$sold', '$price'] } },
          ticketTypes: { $sum: 1 },
        },
      },
      { $project: { _id: 0 } },
    ]);

    const stats = ticketStats[0] || {
      totalCapacity: 0,
      totalSold: 0,
      totalRevenue: 0,
      ticketTypes: 0,
    };

    return {
      event: {
        title: event.title,
        status: event.eventStatus,
        startDate: event.startDate,
        endDate: event.endDate,
      },
      tickets: {
        ...stats,
        availableTickets: stats.totalCapacity - stats.totalSold,
        soldPercentage:
          stats.totalCapacity > 0
            ? ((stats.totalSold / stats.totalCapacity) * 100).toFixed(2)
            : 0,
      },
    };
  }

  async getCompanyEventStats(companyId: string): Promise<any> {
    const stats = await this.eventModel.aggregate([
      {
        $match: {
          companyId: new Types.ObjectId(companyId),
          eventStatus: { $ne: EventStatus.DELETED },
        },
      },
      {
        $group: {
          _id: '$eventStatus',
          count: { $sum: 1 },
        },
      },
    ]);

    const ticketStats = await this.eventModel.aggregate([
      {
        $match: {
          companyId: new Types.ObjectId(companyId),
          eventStatus: { $ne: EventStatus.DELETED },
        },
      },
      {
        $lookup: {
          from: 'ticket_types',
          localField: '_id',
          foreignField: 'eventId',
          as: 'ticketTypes',
        },
      },
      {
        $unwind: {
          path: '$ticketTypes',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $group: {
          _id: null,
          totalEvents: { $addToSet: '$_id' },
          totalRevenue: {
            $sum: { $multiply: ['$ticketTypes.sold', '$ticketTypes.price'] },
          },
          totalTicketsSold: { $sum: '$ticketTypes.sold' },
        },
      },
      {
        $project: {
          _id: 0,
          totalEvents: { $size: '$totalEvents' },
          totalRevenue: 1,
          totalTicketsSold: 1,
        },
      },
    ]);

    const statusCounts = stats.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const financialStats = ticketStats[0] || {
      totalEvents: 0,
      totalRevenue: 0,
      totalTicketsSold: 0,
    };

    return {
      eventsByStatus: statusCounts,
      ...financialStats,
    };
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let slug = baseSlug;
    let counter = 1;

    while (
      await this.eventModel.findOne({
        slug,
        eventStatus: { $ne: EventStatus.DELETED },
      })
    ) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    return slug;
  }
}
