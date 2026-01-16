import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EventSponsor,
  EventSponsorDocument,
} from './entities/event-sponsor.entity';
import {
  SponsorQuotaRequest,
  SponsorQuotaRequestDocument,
  QuotaRequestStatus,
} from './entities/sponsor-quota-request.entity';
import { CreateEventSponsorDto } from './dto/create-event-sponsor.dto';
import { UpdateEventSponsorDto } from './dto/update-event-sponsor.dto';
import { EventSponsorDto, ShortEventDto } from './dto/event-sponsor.dto';
import { CreateQuotaRequestDto } from './dto/create-quota-request.dto';
import { ReviewQuotaRequestDto } from './dto/review-quota-request.dto';
import { QuotaRequestDto } from './dto/quota-request.dto';
import { ParticipantType } from '../common/enums/participant-type.enum';
import { Event, EventDocument } from '../events/entities/event.entity';
import { EventStatus } from '../common/enums/event-status.enum';
import { EventsPaginatedDto } from '../events/dto/events-pagination.dto';
import { toDto } from '../utils/toDto';

@Injectable()
export class EventSponsorsService {
  constructor(
    @InjectModel(EventSponsor.name)
    private readonly eventSponsorModel: Model<EventSponsorDocument>,
    @InjectModel(SponsorQuotaRequest.name)
    private readonly sponsorQuotaRequestModel: Model<SponsorQuotaRequestDocument>,
    @InjectModel(Event.name)
    private readonly eventModel: Model<EventDocument>,
  ) {}

  async addSponsorToEvent(
    eventId: string,
    dto: CreateEventSponsorDto,
    userId: string,
  ): Promise<EventSponsorDto> {
    const eventObjectId = new Types.ObjectId(eventId);
    const companyObjectId = new Types.ObjectId(dto.companyId);

    const existingActive = await this.eventSponsorModel.findOne({
      eventId: eventObjectId,
      companyId: companyObjectId,
      isActive: true,
    });

    if (existingActive) {
      throw new ConflictException(
        'La empresa ya es un patrocinador activo de este evento',
      );
    }

    let sponsor = await this.eventSponsorModel.findOne({
      eventId: eventObjectId,
      companyId: companyObjectId,
    });

    if (!sponsor) {
      sponsor = new this.eventSponsorModel({
        eventId: eventObjectId,
        companyId: companyObjectId,
        staffQuota: dto.staffQuota ?? 0,
        guestQuota: dto.guestQuota ?? 0,
        scholarshipQuota: dto.scholarshipQuota ?? 0,
        staffUsed: 0,
        guestUsed: 0,
        scholarshipUsed: 0,
        isActive: true,
        assignedAt: new Date(),
        assignedBy: new Types.ObjectId(userId),
      });
    } else {
      sponsor.staffQuota = dto.staffQuota ?? sponsor.staffQuota;
      sponsor.guestQuota = dto.guestQuota ?? sponsor.guestQuota;
      sponsor.scholarshipQuota =
        dto.scholarshipQuota ?? sponsor.scholarshipQuota;
      sponsor.isActive = true;
      sponsor.assignedAt = new Date();
      sponsor.assignedBy = new Types.ObjectId(userId);
    }

    const saved = await sponsor.save();
    const populated = await this.eventSponsorModel
      .findById(saved._id)
      .populate('company')
      .populate('event')
      .exec();

    return toDto(populated!, EventSponsorDto);
  }

  async getSponsorsByEvent(eventId: string): Promise<EventSponsorDto[]> {
    const sponsors = await this.eventSponsorModel
      .find({
        eventId: new Types.ObjectId(eventId),
        isActive: true,
      })
      .populate('company')
      .populate('event')
      .sort({ createdAt: -1 })
      .exec();

    return sponsors.map((s) => toDto(s, EventSponsorDto));
  }

  async getSponsorDetails(sponsorId: string): Promise<EventSponsorDto> {
    const sponsor = await this.eventSponsorModel
      .findById(new Types.ObjectId(sponsorId))
      .populate('company')
      .populate('event')
      .exec();

    if (!sponsor) {
      throw new NotFoundException('Patrocinador no encontrado');
    }

    return toDto(sponsor, EventSponsorDto);
  }

  async updateSponsorQuotas(
    sponsorId: string,
    dto: UpdateEventSponsorDto,
    userId: string,
  ): Promise<EventSponsorDto> {
    const sponsor = await this.eventSponsorModel.findById(
      new Types.ObjectId(sponsorId),
    );

    if (!sponsor) {
      throw new NotFoundException('Patrocinador no encontrado');
    }

    if (dto.staffQuota !== undefined && dto.staffQuota < sponsor.staffUsed) {
      throw new BadRequestException(
        `No se puede reducir la cuota de staff a ${dto.staffQuota}. Ya se han usado ${sponsor.staffUsed}`,
      );
    }

    if (dto.guestQuota !== undefined && dto.guestQuota < sponsor.guestUsed) {
      throw new BadRequestException(
        `No se puede reducir la cuota de invitados a ${dto.guestQuota}. Ya se han usado ${sponsor.guestUsed}`,
      );
    }

    if (
      dto.scholarshipQuota !== undefined &&
      dto.scholarshipQuota < sponsor.scholarshipUsed
    ) {
      throw new BadRequestException(
        `No se puede reducir la cuota de becas a ${dto.scholarshipQuota}. Ya se han usado ${sponsor.scholarshipUsed}`,
      );
    }

    if (dto.staffQuota !== undefined) {
      sponsor.staffQuota = dto.staffQuota;
    }
    if (dto.guestQuota !== undefined) {
      sponsor.guestQuota = dto.guestQuota;
    }
    if (dto.scholarshipQuota !== undefined) {
      sponsor.scholarshipQuota = dto.scholarshipQuota;
    }
    if (dto.isActive !== undefined) {
      sponsor.isActive = dto.isActive;
    }

    sponsor.updatedBy = new Types.ObjectId(userId);

    const saved = await sponsor.save();
    const populated = await this.eventSponsorModel
      .findById(saved._id)
      .populate('company')
      .populate('event')
      .exec();

    return toDto(populated!, EventSponsorDto);
  }

  async removeSponsor(
    sponsorId: string,
    userId: string,
  ): Promise<EventSponsorDto> {
    const sponsor = await this.eventSponsorModel.findById(
      new Types.ObjectId(sponsorId),
    );

    if (!sponsor) {
      throw new NotFoundException('Patrocinador no encontrado');
    }

    if (!sponsor.isActive) {
      throw new BadRequestException('El patrocinador ya está inactivo');
    }

    sponsor.isActive = false;
    sponsor.updatedBy = new Types.ObjectId(userId);
    const saved = await sponsor.save();
    const populated = await this.eventSponsorModel
      .findById(saved._id)
      .populate('company')
      .populate('event')
      .exec();

    return toDto(populated!, EventSponsorDto);
  }

  async findBySponsorId(
    sponsorId: string,
  ): Promise<EventSponsorDocument | null> {
    return this.eventSponsorModel
      .findById(new Types.ObjectId(sponsorId))
      .exec();
  }

  async findByCompanyId(companyId: string): Promise<EventSponsorDocument[]> {
    return this.eventSponsorModel
      .find({
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .exec();
  }

  async findByCompanyIds(
    companyIds: string[],
  ): Promise<EventSponsorDocument[]> {
    return this.eventSponsorModel
      .find({
        companyId: { $in: companyIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      })
      .exec();
  }

  async checkQuotaAvailability(
    sponsorId: string,
    type: ParticipantType,
  ): Promise<boolean> {
    const sponsor = await this.findBySponsorId(sponsorId);
    if (!sponsor || !sponsor.isActive) {
      return false;
    }

    switch (type) {
      case ParticipantType.STAFF:
        return sponsor.staffQuota - sponsor.staffUsed > 0;
      case ParticipantType.GUEST:
        return sponsor.guestQuota - sponsor.guestUsed > 0;
      case ParticipantType.SCHOLARSHIP:
        return sponsor.scholarshipQuota - sponsor.scholarshipUsed > 0;
      default:
        return false;
    }
  }

  async incrementQuotaUsage(
    sponsorId: string,
    type: ParticipantType,
  ): Promise<void> {
    const sponsor = await this.findBySponsorId(sponsorId);
    if (!sponsor) {
      throw new NotFoundException('Patrocinador no encontrado');
    }

    switch (type) {
      case ParticipantType.STAFF:
        sponsor.staffUsed += 1;
        break;
      case ParticipantType.GUEST:
        sponsor.guestUsed += 1;
        break;
      case ParticipantType.SCHOLARSHIP:
        sponsor.scholarshipUsed += 1;
        break;
      default:
        break;
    }

    await sponsor.save();
  }

  async decrementQuotaUsage(
    sponsorId: string,
    type: ParticipantType,
  ): Promise<void> {
    const sponsor = await this.findBySponsorId(sponsorId);
    if (!sponsor) {
      throw new NotFoundException('Patrocinador no encontrado');
    }

    switch (type) {
      case ParticipantType.STAFF:
        sponsor.staffUsed = Math.max(0, sponsor.staffUsed - 1);
        break;
      case ParticipantType.GUEST:
        sponsor.guestUsed = Math.max(0, sponsor.guestUsed - 1);
        break;
      case ParticipantType.SCHOLARSHIP:
        sponsor.scholarshipUsed = Math.max(0, sponsor.scholarshipUsed - 1);
        break;
      default:
        break;
    }

    await sponsor.save();
  }

  async getEventsByCompany(
    companyId: string,
    statuses?: EventStatus[],
    page = 1,
    limit = 10,
  ): Promise<EventsPaginatedDto> {
    const sponsors = await this.eventSponsorModel
      .find({
        companyId: new Types.ObjectId(companyId),
        isActive: true,
      })
      .select('eventId')
      .exec();

    const eventIds = sponsors.map((s) => s.eventId);
    if (eventIds.length === 0) {
      const empty = new EventsPaginatedDto();
      empty.data = [];
      empty.totalItems = 0;
      empty.totalPages = 0;
      empty.currentPage = page;
      empty.hasNextPage = false;
      empty.hasPreviousPage = false;
      return empty;
    }

    const filter: any = {
      _id: { $in: eventIds },
    };

    if (statuses && statuses.length > 0) {
      filter.eventStatus = { $in: statuses };
    }

    const totalItems = await this.eventModel.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);
    const skip = (page - 1) * limit;

    const events = await this.eventModel
      .find(filter)
      .sort({ startDate: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const data = events.map((e) => {
      const dto = new ShortEventDto();
      dto.id = e._id.toString();
      dto.title = e.title;
      dto.shortDescription = e.shortDescription;
      dto.startDate = e.startDate;
      dto.endDate = e.endDate;
      dto.eventStatus = e.eventStatus;
      return dto;
    });

    const result = new EventsPaginatedDto();
    result.data = data;
    result.totalItems = totalItems;
    result.totalPages = totalPages;
    result.currentPage = page;
    result.hasNextPage = page < totalPages;
    result.hasPreviousPage = page > 1;

    return result;
  }

  async createQuotaRequest(
    eventId: string,
    createDto: CreateQuotaRequestDto,
    userId: string,
    userCompanyIds: string[],
  ): Promise<QuotaRequestDto> {
    const sponsor = await this.eventSponsorModel.findOne({
      eventId: new Types.ObjectId(eventId),
      companyId: { $in: userCompanyIds.map((id) => new Types.ObjectId(id)) },
      isActive: true,
    });

    if (!sponsor) {
      throw new NotFoundException('You are not a sponsor for this event');
    }

    const request = new this.sponsorQuotaRequestModel({
      eventSponsorId: sponsor._id,
      requestedBy: new Types.ObjectId(userId),
      type: createDto.type,
      requestedAmount: createDto.requestedAmount,
      reason: createDto.reason,
      status: QuotaRequestStatus.PENDING,
    });

    await request.save();
    return toDto(request, QuotaRequestDto);
  }

  async reviewQuotaRequest(
    requestId: string,
    reviewDto: ReviewQuotaRequestDto,
    reviewerId: string,
  ): Promise<QuotaRequestDto> {
    const request = await this.sponsorQuotaRequestModel.findById(requestId);
    if (!request) {
      throw new NotFoundException('Quota request not found');
    }

    if (request.status !== QuotaRequestStatus.PENDING) {
      throw new ConflictException('Request is already reviewed');
    }

    request.status = reviewDto.status;
    request.reviewedBy = new Types.ObjectId(reviewerId);
    request.reviewedAt = new Date();

    if (reviewDto.status === QuotaRequestStatus.APPROVED) {
      request.approvedAmount =
        reviewDto.approvedAmount || request.requestedAmount;

      const sponsor = await this.eventSponsorModel.findById(
        request.eventSponsorId,
      );
      if (sponsor) {
        switch (request.type) {
          case ParticipantType.STAFF:
            sponsor.staffQuota += request.approvedAmount;
            break;
          case ParticipantType.GUEST:
            sponsor.guestQuota += request.approvedAmount;
            break;
          case ParticipantType.SCHOLARSHIP:
            sponsor.scholarshipQuota += request.approvedAmount;
            break;
        }
        await sponsor.save();
      }
    } else {
      request.rejectionReason = reviewDto.rejectionReason;
    }

    await request.save();
    return toDto(request, QuotaRequestDto);
  }

  async getQuotaRequests(
    eventId: string,
    status?: QuotaRequestStatus,
  ): Promise<QuotaRequestDto[]> {
    const sponsors = await this.eventSponsorModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .select('_id');
    const sponsorIds = sponsors.map((s) => s._id);

    const filter: any = { eventSponsorId: { $in: sponsorIds } };
    if (status) {
      filter.status = status;
    }

    const requests = await this.sponsorQuotaRequestModel
      .find(filter)
      .populate('requester', 'firstName lastName email')
      .populate('reviewer', 'firstName lastName email')
      .populate({
        path: 'eventSponsor',
        populate: { path: 'company', select: 'name' },
      })
      .sort({ createdAt: -1 })
      .exec();

    return requests.map((r) => toDto(r, QuotaRequestDto));
  }

  async getMyQuotaRequests(
    eventId: string,
    companyIds: string[],
  ): Promise<QuotaRequestDto[]> {
    if (!companyIds || companyIds.length === 0) {
      return [];
    }

    const sponsors = await this.eventSponsorModel
      .find({
        eventId: new Types.ObjectId(eventId),
        companyId: {
          $in: companyIds.map((id) => new Types.ObjectId(id)),
        },
      })
      .select('_id')
      .exec();

    if (sponsors.length === 0) {
      return [];
    }

    const sponsorIds = sponsors.map((s) => s._id);

    const requests = await this.sponsorQuotaRequestModel
      .find({ eventSponsorId: { $in: sponsorIds } })
      .populate('requester', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();

    return requests.map((r) => toDto(r, QuotaRequestDto));
  }
}
