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
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import { EventFilterDto } from './dto/event-filter.dto';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { toObjectId } from 'src/utils/toObjectId';
import { EventDto } from './dto/event.dto';
import { toDto } from 'src/utils/toDto';
import { sanitizeDefined } from 'src/utils/sanitizeDefined';
import { escapeRegex } from 'src/utils/escapeRegex';
import { EventPaginatedDto } from './dto/event-pagination.dto';
import { EventStatsDto } from './dto/event-stats.dto';
import { CompanyEventStatsDto } from './dto/company-event-stats.dto';
import { TicketTypeDto } from './dto/ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';

type SortDir = 1 | -1;

interface RequestingUser {
  id: string;
  email?: string;
  roles: string[];
  companyId?: string;
}

function needsLookup(sortObj: Record<string, SortDir>): boolean {
  return Object.keys(sortObj).some((k) => k.includes('.'));
}

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name)
    private readonly ticketTypeModel: Model<TicketTypeDocument>,
    @Inject(forwardRef(() => CompaniesService))
    private readonly companiesService: CompaniesService,
  ) { }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = title
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

  private parseSort(
    sortRaw: string | undefined,
    fallbackOrder: 'asc' | 'desc' | 'ASC' | 'DESC',
  ): Record<string, SortDir> {
    const normalizedOrder = fallbackOrder.toLowerCase() as 'asc' | 'desc';
    const def: SortDir = normalizedOrder === 'asc' ? 1 : -1;
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
          path: 'person',
        },
      })
      .exec();

    if (!doc) {
      throw new NotFoundException(
        `No se encontró el evento con ID ${created._id}`,
      );
    }

    return toDto(doc, EventDto);
  }

  private buildEventStatusFilters(
    requestingUser: RequestingUser | undefined,
    eventStatus?: EventStatus,
  ): FilterQuery<Event> {
    const filters: FilterQuery<Event> = {};

    // Si se especifica un eventStatus explícito en los filtros
    if (eventStatus) {
      filters.eventStatus = eventStatus;

      // Solo incluir eventos no eliminados (soft delete) excepto si se buscan DELETED
      if (eventStatus !== EventStatus.DELETED) {
        filters.$and = [
          {
            $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
          },
        ];
      }
      return filters;
    }

    // Lógica basada en el rol del usuario cuando NO se especifica eventStatus
    const userRoles = requestingUser?.roles || [];

    if (userRoles.includes(UserRole.USER) || !requestingUser) {
      // Usuarios normales o anónimos: solo ven eventos PUBLISHED o COMPLETED
      filters.eventStatus = {
        $in: [EventStatus.PUBLISHED, EventStatus.COMPLETED],
      };
      filters.$and = [
        {
          $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
        },
      ];
    } else if (userRoles.includes(UserRole.COMPANY_ADMIN)) {
      // Company admins: ven todos los estados excepto DELETED
      filters.eventStatus = { $ne: EventStatus.DELETED };
      filters.$and = [
        {
          $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
        },
      ];
    } else if (userRoles.includes(UserRole.PLATFORM_ADMIN)) {
      // Platform admins: ven todos los estados excepto DELETED
      filters.eventStatus = { $ne: EventStatus.DELETED };
      filters.$and = [
        {
          $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
        },
      ];
    } else {
      // Cualquier otro rol: excluir DELETED
      filters.eventStatus = { $ne: EventStatus.DELETED };
      filters.$and = [
        {
          $or: [{ deletedAt: { $exists: false } }, { deletedAt: null }],
        },
      ];
    }

    return filters;
  }

  private buildCompanyFilter(
    requestingUser: RequestingUser | undefined,
    companyId?: string,
  ): { companyId?: Types.ObjectId } {
    // Si el usuario es COMPANY_ADMIN, siempre filtrar por su companyId
    if (
      requestingUser?.roles.includes(UserRole.COMPANY_ADMIN) &&
      requestingUser?.companyId
    ) {
      return { companyId: toObjectId(requestingUser.companyId) };
    }

    // Si se proporciona companyId en los parámetros, usarlo
    if (companyId) {
      return { companyId: toObjectId(companyId) };
    }

    return {};
  }

  private buildSearchFilter(search?: string): { $or?: any[] } {
    if (!search?.trim()) {
      return {};
    }

    const regex = { $regex: escapeRegex(search.trim()), $options: 'i' };
    return {
      $or: [
        { title: regex },
        { description: regex },
        { shortDescription: regex },
        { tags: regex },
        { categories: regex },
      ],
    };
  }

  async findAll(
    filterDto: EventFilterDto,
    requestingUser?: RequestingUser,
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

    // 1. Filtro de compañía
    Object.assign(match, this.buildCompanyFilter(requestingUser, companyId));

    // 2. Filtros de estado y soft delete
    const statusFilters = this.buildEventStatusFilters(
      requestingUser,
      eventStatus,
    );
    Object.assign(match, statusFilters);

    // 3. Filtro de tipo de evento
    if (type) {
      match.type = type;
    }

    // 4. Filtros de ubicación
    if (locationType) {
      match['location.type'] = locationType;
    }
    if (city) {
      match['location.address.city'] = {
        $regex: escapeRegex(city),
        $options: 'i',
      };
    }
    if (country) {
      match['location.address.country'] = {
        $regex: escapeRegex(country),
        $options: 'i',
      };
    }

    // 5. Filtros de fechas
    if (startFrom || startTo) {
      match.startDate = {};
      if (startFrom) match.startDate.$gte = new Date(startFrom);
      if (startTo) match.startDate.$lte = new Date(startTo);
    }
    if (endFrom || endTo) {
      match.endDate = {};
      if (endFrom) match.endDate.$gte = new Date(endFrom);
      if (endTo) match.endDate.$lte = new Date(endTo);
    }

    // 6. Filtros de tags y categorías
    if (Array.isArray(tags) && tags.length) {
      match.tags = { $in: tags };
    }
    if (Array.isArray(categories) && categories.length) {
      match.categories = { $in: categories };
    }

    // 7. Filtro de speaker
    if (speakerId) {
      match.speakers = toObjectId(speakerId);
    }

    // 8. Filtro de búsqueda de texto
    // Si hay búsqueda de texto, necesitamos combinar con $and para no sobrescribir el $or de deletedAt
    const searchFilter = this.buildSearchFilter(search);
    if (searchFilter.$or) {
      // Si ya existe un $and, agregar el filtro de búsqueda
      if (match.$and) {
        match.$and.push(searchFilter);
      } else {
        // Si no existe $and, crearlo con el filtro de búsqueda
        match.$and = [searchFilter];
      }
    }

    // 9. Ordenamiento
    const sortObj = this.parseSort(sort, order);

    // 10. Ejecución de la query con o sin lookup
    if (needsLookup(sortObj)) {
      return this.executeAggregationQuery(match, sortObj, skip, limit, page);
    }

    return this.executeStandardQuery(match, sortObj, skip, limit, page);
  }

  /**
   * Ejecuta la query usando aggregation pipeline (cuando se necesita lookup)
   * @private
   */
  private async executeAggregationQuery(
    match: FilterQuery<Event>,
    sortObj: Record<string, SortDir>,
    skip: number,
    limit: number,
    page: number,
  ): Promise<EventPaginatedDto> {
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

  /**
   * Ejecuta la query estándar con populate
   * @private
   */
  private async executeStandardQuery(
    match: FilterQuery<Event>,
    sortObj: Record<string, SortDir>,
    skip: number,
    limit: number,
    page: number,
  ): Promise<EventPaginatedDto> {
    const projection: ProjectionType<Event> = {};
    const query = this.eventModel
      .find(match, projection, {
        collation: { locale: 'es', strength: 2 },
      } as QueryOptions)
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'person',
        },
      })
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const [items, totalItems] = await Promise.all([
      query.exec(),
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

  async findOne(
    id: string,
    requestingUser?: RequestingUser,
  ): Promise<EventDto> {
    const filter: any = { _id: id };

    const event = await this.eventModel
      .findOne(filter)
      .populate('company')
      .populate({
        path: 'speakers',
        populate: {
          path: 'person',
          select: 'firstName lastName email',
        },
      })
      .exec();

    if (!event) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    if (
      requestingUser?.roles.includes(UserRole.COMPANY_ADMIN) &&
      requestingUser?.companyId
    ) {
      if (event.companyId._id.toString() !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Acceso denegado. El evento pertenece a otra empresa.',
        );
      }
    }

    if (requestingUser?.roles.includes(UserRole.USER) || !requestingUser) {
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

  async findBySlug(slug: string): Promise<EventDto> {
    const event = await this.eventModel
      .findOne({
        slug,
        eventStatus: { $in: [EventStatus.PUBLISHED, EventStatus.COMPLETED] },
      })
      .populate('company')
      .populate({
        path: 'speakers',
        populate: [
          { path: 'personId' },
          { path: 'companyId' },
        ],
      })
      .exec();
    console.log(event);
    if (!event) {
      throw new NotFoundException(`No se encontró el evento con slug '${slug}`);
    }

    return toDto(event, EventDto);
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    updatedBy: string,
  ): Promise<EventDto> {
    const existing = await this.eventModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

    // Validar slug único si se está actualizando
    if (updateEventDto.slug && updateEventDto.slug !== existing.slug) {
      const slugExists = await this.eventModel.exists({
        slug: updateEventDto.slug,
        companyId: existing.companyId,
        _id: { $ne: existing._id },
        eventStatus: { $ne: EventStatus.DELETED },
      });
      if (slugExists) {
        throw new BadRequestException('Slug ya existe para esta empresa');
      }
    }

    // Validar fechas
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

    // Preparar datos para actualización
    // IMPORTANTE: No incluir companyId ni eventStatus (se manejan por separado)
    const updateData: Record<string, unknown> = {
      ...updateEventDto,
      updatedBy: toObjectId(updatedBy),
      updatedAt: new Date(),
    };

    // Convertir speakers a ObjectId si están presentes
    if (Array.isArray(updateEventDto.speakers)) {
      updateData.speakers = updateEventDto.speakers.map(toObjectId);
    }

    // Convertir fechas si están presentes
    if (updateEventDto.startDate) {
      updateData.startDate = startDate;
    }
    if (updateEventDto.endDate) {
      updateData.endDate = endDate;
    }

    // Sanitizar undefined values
    const $set = sanitizeDefined(updateData);

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
          path: 'person',
        },
      })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Evento con ID ${id} no encontrado`);
    }

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
          path: 'person',
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

  async getEventStats(eventId: string): Promise<EventStatsDto> {
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

  async getCompanyEventStats(companyId: string): Promise<CompanyEventStatsDto> {
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

  async createTicketType(
    eventId: string,
    createTicketTypeDto: CreateTicketTypeDto,
    createdBy: string,
  ): Promise<TicketTypeDto> {
    try {
      const event = await this.eventModel
        .findOne({
          _id: toObjectId(eventId),
          eventStatus: { $ne: EventStatus.DELETED },
        })
        .lean()
        .exec();

      if (!event) throw new NotFoundException('Evento no encontrado');

      const ticketTypeData = {
        ...createTicketTypeDto,
        eventId: new Types.ObjectId(eventId),
        createdBy: new Types.ObjectId(createdBy),
        ticketStatus:
          createTicketTypeDto.ticketStatus ?? TicketStatus.AVAILABLE,
      };

      const created = await this.ticketTypeModel.create(ticketTypeData);

      return toDto(created, TicketTypeDto);
    } catch (error) {
      throw error;
    }
  }

  async updateTicketType(
    ticketTypeId: string,
    updateData: UpdateTicketTypeDto,
    updatedBy: string,
  ): Promise<TicketTypeDto> {
    const current = await this.ticketTypeModel.findById(ticketTypeId).exec();
    if (!current) {
      throw new NotFoundException(
        `No se ha encontrado el tipo de ticket con ID ${ticketTypeId}`,
      );
    }

    const $set = sanitizeDefined({
      ...updateData,
      updatedBy: toObjectId(updatedBy),
      updatedAt: new Date(),
    });

    const updated = await this.ticketTypeModel
      .findByIdAndUpdate(
        ticketTypeId,
        { $set },
        {
          new: true,
          runValidators: true,
          context: 'query',
        },
      )
      .exec();

    if (!updated)
      throw new NotFoundException(
        `Ticket con ID ${ticketTypeId} no encontrado`,
      );

    return toDto(updated, TicketTypeDto);
  }

  async getEventTicketTypes(eventId: string): Promise<TicketTypeDto[]> {
    const docs = await this.ticketTypeModel
      .find({
        eventId: new Types.ObjectId(eventId),
      })
      .sort({ createdAt: 1 })
      .exec();

    return docs.map((d) => toDto(d, TicketTypeDto));
  }

  async deleteTicketType(ticketTypeId: string): Promise<void> {
    const ticketType = await this.ticketTypeModel.findById(ticketTypeId);
    if (!ticketType) {
      throw new NotFoundException(
        `No se ha encontrado el tipo de ticket con ID ${ticketTypeId}`,
      );
    }

    if (ticketType.sold > 0) {
      throw new BadRequestException(
        'No se puede eliminar un tipo de entrada que ya se ha vendido.',
      );
    }

    await this.ticketTypeModel.findByIdAndDelete(ticketTypeId);
  }
}
