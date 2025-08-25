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
import { Model, Types } from 'mongoose';
import { EventDocument } from './entities/event.entity';
import { CompaniesService } from 'src/companies/companies.service';
import { SpeakersService } from 'src/speakers/speakers.service';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';
import { EventFilterDto } from './dto/event-filter.dto';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name)
    private ticketTypeModel: Model<TicketTypeDocument>,
    @Inject(forwardRef(() => CompaniesService))
    private companiesService: CompaniesService,
    @Inject(forwardRef(() => SpeakersService))
    private speakersService: SpeakersService,
  ) {}

  async create(
    createEventDto: CreateEventDto,
    createdBy: string,
  ): Promise<EventDocument> {
    try {
      const company = await this.companiesService.findOne(
        createEventDto.companyId,
      );
      if (company.entityStatus !== EntityStatus.ACTIVE) {
        throw new BadRequestException('Company is not active');
      }

      if (createEventDto.speakers && createEventDto.speakers.length > 0) {
        for (const speakerId of createEventDto.speakers) {
          const speaker = await this.speakersService.findOne(speakerId);
          if (speaker.companyId.toString() !== createEventDto.companyId) {
            throw new BadRequestException(
              `Speaker ${speakerId} does not belong to the specified company`,
            );
          }
        }
      }

      let slug = createEventDto.slug;
      if (!slug) {
        slug = await this.generateUniqueSlug(createEventDto.title);
      } else {
        const existingEvent = await this.eventModel.findOne({
          slug,
          eventStatus: { $ne: EventStatus.DELETED },
        });
        if (existingEvent) {
          throw new BadRequestException('Slug already exists');
        }
      }

      const startDate = new Date(createEventDto.startDate);
      const endDate = new Date(createEventDto.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      if (startDate < new Date()) {
        throw new BadRequestException('Event cannot start in the past');
      }

      const eventData = {
        ...createEventDto,
        slug,
        companyId: new Types.ObjectId(createEventDto.companyId),
        speakers:
          createEventDto.speakers?.map((id) => new Types.ObjectId(id)) || [],
        createdBy: new Types.ObjectId(createdBy),
        eventStatus: EventStatus.DRAFT,
        startDate,
        endDate,
      };

      const event = new this.eventModel(eventData);
      return await event.save();
    } catch (error) {
      throw error;
    }
  }

  async findAll(
    filterDto: EventFilterDto,
    requestingUser?: any,
  ): Promise<PaginationMetaDto<Event>> {
    const {
      page = 1,
      limit = 10,
      sort,
      order,
      companyId,
      type,
      eventStatus,
      locationType,
      city,
      country,
      startDateFrom,
      startDateTo,
      category,
      tag,
      speakerId,
      hasAvailableTickets,
      minPrice,
      maxPrice,
      search,
    } = filterDto;
    const skip = (page - 1) * limit;

    const pipeline: any[] = [
      {
        $lookup: {
          from: 'companies',
          let: { uid: '$companyId' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
            {
              $project: {
                _id: 1,
                name: 1,
                logo: 1,
              },
            },
          ],
          as: 'company',
        },
      },
      { $unwind: '$company' },
      {
        $lookup: {
          from: 'speakers',
          localField: 'speakers',
          foreignField: '_id',
          as: 'speakerDetails',
        },
      },
      {
        $lookup: {
          from: 'persons',
          localField: 'speakerDetails.personId',
          foreignField: '_id',
          as: 'speakerPersons',
        },
      },
      {
        $lookup: {
          from: 'users',
          let: { uid: '$createdBy' },
          pipeline: [
            { $match: { $expr: { $eq: ['$_id', '$$uid'] } } },
            {
              $project: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                email: 1,
              },
            },
          ],
          as: 'creator',
        },
      },
      {
        $addFields: {
          creator: { $arrayElemAt: ['$creator', 0] },
        },
      },
      {
        $unset: [
          'companyId',
          'createdBy',
          'updatedAt',
          'approvedAt',
          'approvedBy',
          'speakers',
        ],
      },
    ];

    if (
      hasAvailableTickets !== undefined ||
      minPrice !== undefined ||
      maxPrice !== undefined
    ) {
      pipeline.push({
        $lookup: {
          from: 'ticket_types',
          localField: '_id',
          foreignField: 'eventId',
          as: 'ticketTypes',
        },
      });
    }

    const matchFilter: any = {};

    if (
      requestingUser?.role === UserRole.COMPANY_ADMIN &&
      requestingUser?.companyId
    ) {
      matchFilter.companyId = new Types.ObjectId(requestingUser.companyId);
    } else if (companyId) {
      matchFilter.companyId = new Types.ObjectId(companyId);
    }

    if (eventStatus) {
      matchFilter.eventStatus = eventStatus;
    } else if (requestingUser?.role === UserRole.USER || !requestingUser) {
      matchFilter.eventStatus = {
        $in: [EventStatus.PUBLISHED, EventStatus.COMPLETED],
      };
    }

    if (type) {
      matchFilter.type = type;
    }

    if (locationType) {
      matchFilter['location.type'] = locationType;
    }
    if (city) {
      matchFilter['location.address.city'] = { $regex: city, $options: 'i' };
    }
    if (country) {
      matchFilter['location.address.country'] = {
        $regex: country,
        $options: 'i',
      };
    }

    if (startDateFrom || startDateTo) {
      matchFilter.startDate = {};
      if (startDateFrom) matchFilter.startDate.$gte = new Date(startDateFrom);
      if (startDateTo) matchFilter.startDate.$lte = new Date(startDateTo);
    }

    if (category) {
      matchFilter.categories = { $regex: category, $options: 'i' };
    }
    if (tag) {
      matchFilter.tags = { $regex: tag, $options: 'i' };
    }

    if (speakerId) {
      matchFilter.speakers = new Types.ObjectId(speakerId);
    }

    if (hasAvailableTickets) {
      matchFilter['ticketTypes'] = {
        $elemMatch: {
          ticketStatus: TicketStatus.AVAILABLE,
          $expr: { $gt: [{ $subtract: ['$quantity', '$sold'] }, 0] },
        },
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter: any = {};
      if (minPrice !== undefined) priceFilter.$gte = minPrice;
      if (maxPrice !== undefined) priceFilter.$lte = maxPrice;

      matchFilter['ticketTypes.price'] = priceFilter;
    }

    if (search) {
      matchFilter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { shortDescription: { $regex: search, $options: 'i' } },
        { tags: { $elemMatch: { $regex: search, $options: 'i' } } },
        { categories: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    pipeline.push({ $match: matchFilter });

    const sortField: string =
      typeof sort === 'string' && sort.trim() ? sort.trim() : 'createdAt';

    const sortDir: 1 | -1 = order === 'asc' ? 1 : -1;

    const safeSortField = /^[a-zA-Z0-9.]+$/.test(sortField)
      ? sortField
      : 'createdAt';

    const sortOptions: Record<string, 1 | -1> = { [safeSortField]: sortDir };

    pipeline.push({ $sort: sortOptions });

    const [data, totalResult] = await Promise.all([
      this.eventModel.aggregate([
        ...pipeline,
        { $skip: skip },
        { $limit: limit },
      ]),
      this.eventModel.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const totalItems = totalResult[0]?.total || 0;
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
  ): Promise<EventDocument> {
    const filter: any = { _id: id };
    if (!includeDeleted) {
      filter.eventStatus = { $ne: EventStatus.DELETED };
    }

    const event = await this.eventModel
      .findOne(filter)
      .populate('companyId', 'name contactEmail status')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
          select: 'firstName lastName email',
        },
      })
      .populate('createdBy', 'email role')
      .populate('updatedBy', 'email role')
      .exec();

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    if (
      requestingUser?.role === UserRole.COMPANY_ADMIN &&
      requestingUser?.companyId
    ) {
      if (event.companyId._id.toString() !== requestingUser.companyId) {
        throw new ForbiddenException(
          'Access denied. Event belongs to different company.',
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
        throw new ForbiddenException('Event is not publicly available');
      }
    }

    return event;
  }

  async findBySlug(slug: string): Promise<EventDocument> {
    const event = await this.eventModel
      .findOne({
        slug,
        eventStatus: { $in: [EventStatus.PUBLISHED, EventStatus.COMPLETED] },
      })
      .populate('companyId', 'name contactEmail')
      .populate({
        path: 'speakers',
        populate: {
          path: 'personId',
          select: 'firstName lastName email',
        },
      })
      .exec();

    if (!event) {
      throw new NotFoundException(`Event with slug '${slug}' not found`);
    }

    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    updatedBy: string,
  ): Promise<EventDocument> {
    try {
      const existingEvent = await this.findOne(id);

      if (updateEventDto.speakers) {
        for (const speakerId of updateEventDto.speakers) {
          const speaker = await this.speakersService.findOne(speakerId);
          if (
            speaker.companyId.toString() !== existingEvent.companyId.toString()
          ) {
            throw new BadRequestException(
              `Speaker ${speakerId} does not belong to the event's company`,
            );
          }
        }
      }

      if (updateEventDto.slug && updateEventDto.slug !== existingEvent.slug) {
        const existingSlugEvent = await this.eventModel.findOne({
          slug: updateEventDto.slug,
          _id: { $ne: id },
          eventStatus: { $ne: EventStatus.DELETED },
        });
        if (existingSlugEvent) {
          throw new BadRequestException('Slug already exists');
        }
      }

      const startDate = updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : existingEvent.startDate;
      const endDate = updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : existingEvent.endDate;

      if (startDate >= endDate) {
        throw new BadRequestException('End date must be after start date');
      }

      const updateData: any = { ...updateEventDto };

      if (updateEventDto.speakers) {
        updateData.speakers = updateEventDto.speakers.map(
          (id) => new Types.ObjectId(id),
        );
      }

      updateData.updatedBy = new Types.ObjectId(updatedBy);
      updateData.updatedAt = new Date();

      const event = await this.eventModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .populate('companyId', 'name contactEmail')
        .populate({
          path: 'speakers',
          populate: {
            path: 'personId',
            select: 'firstName lastName email',
          },
        })
        .populate('createdBy', 'email role')
        .populate('updatedBy', 'email role')
        .exec();

      if (!event) {
        throw new NotFoundException(`Event with ID ${id} not found`);
      }

      return event;
    } catch (error) {
      throw error;
    }
  }

  async changeEventStatus(
    id: string,
    eventStatus: EventStatus,
    changedBy: string,
    rejectionReason?: string,
  ): Promise<EventDocument> {
    const changedById = new Types.ObjectId(changedBy);

    const $set: Record<string, any> = {
      eventStatus,
      updatedBy: changedById,
    };
    const $unset: Record<string, ''> = {};

    if (eventStatus === EventStatus.APPROVED) {
      $set.approvedBy = changedById;
      $set.approvedAt = new Date();
      $unset.rejectionReason = '';
    } else if (eventStatus === EventStatus.REJECTED) {
      if (!rejectionReason?.trim()) {
        throw new BadRequestException(
          'rejectionReason is required when rejecting an event',
        );
      }
      $set.rejectionReason = rejectionReason;
      $unset.approvedBy = '';
      $unset.approvedAt = '';
    }

    const updateDoc: any = { $set, $currentDate: { updatedAt: true } };
    if (Object.keys($unset).length) updateDoc.$unset = $unset;

    const event = (await this.eventModel
      .findByIdAndUpdate(id, updateDoc, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .populate('companyId', 'name contactEmail')
      .populate('speakers')
      .populate('approvedBy', 'email role')
      .exec()) as EventDocument | null;

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
  }

  async submitForReview(id: string) {
    const event = await this.eventModel.findOne({ _id: id });

    if (!event) throw new NotFoundException('Event not found');

    if (event.eventStatus !== EventStatus.DRAFT) {
      throw new BadRequestException('Only draft events can be submitted');
    }

    if (!event.location?.type)
      throw new BadRequestException('Location type is required');

    if (event.location.capacity && event.location.capacity < 1)
      throw new BadRequestException('Capacity must be >= 1');

    event.eventStatus = EventStatus.PENDING_APPROVAL;
    event.rejectionReason = undefined;
    return event.save();
  }

  async softDelete(id: string, deletedBy: string): Promise<EventDocument> {
    const updateDoc: any = {
      $set: {
        deletedBy: new Types.ObjectId(deletedBy),
      },
      $currentDate: { deletedAt: true, updatedAt: true },
    };

    const doc = await this.eventModel
      .findByIdAndUpdate(id, updateDoc, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .exec();

    if (!doc) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return doc;
  }

  async publish(id: string, publishedBy: string): Promise<EventDocument> {
    const event = await this.findOne(id);

    if (event.eventStatus !== EventStatus.APPROVED) {
      throw new BadRequestException(
        'Event must be approved before it can be published',
      );
    }

    return this.changeEventStatus(id, EventStatus.PUBLISHED, publishedBy);
  }

  async cancel(
    id: string,
    cancelledBy: string,
    reason?: string,
  ): Promise<EventDocument> {
    await this.findOne(id);

    const $set: Record<string, any> = {
      eventStatus: EventStatus.CANCELLED,
      updatedBy: new Types.ObjectId(cancelledBy),
    };

    if (reason?.trim()) {
      $set.rejectionReason = reason.trim();
    }

    const updateDoc: any = {
      $set,
      $currentDate: { updatedAt: true },
    };

    const event = (await this.eventModel
      .findByIdAndUpdate(id, updateDoc, {
        new: true,
        runValidators: true,
        context: 'query',
      })
      .populate('companyId', 'name contactEmail')
      .populate('speakers')
      .exec()) as EventDocument | null;

    if (!event) {
      throw new NotFoundException(`Event with ID ${id} not found`);
    }

    return event;
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
}
