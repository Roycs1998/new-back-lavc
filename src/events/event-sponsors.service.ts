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
import { CreateEventSponsorDto } from './dto/create-event-sponsor.dto';
import { UpdateEventSponsorDto } from './dto/update-event-sponsor.dto';
import { EventSponsorDto } from './dto/event-sponsor.dto';
import { ParticipantType } from '../common/enums/participant-type.enum';
import { toDto } from '../utils/toDto';

@Injectable()
export class EventSponsorsService {
  constructor(
    @InjectModel(EventSponsor.name)
    private eventSponsorModel: Model<EventSponsorDocument>,
  ) {}

  async addSponsorToEvent(
    eventId: string,
    createDto: CreateEventSponsorDto,
    userId: string,
  ): Promise<EventSponsorDto> {
    const eventObjectId = new Types.ObjectId(eventId);
    const userObjectId = new Types.ObjectId(userId);
    const companyObjectId = new Types.ObjectId(createDto.companyId);

    // Check if sponsor already exists (active or inactive)
    const existing = await this.eventSponsorModel.findOne({
      eventId: eventObjectId,
      companyId: companyObjectId,
    });

    // If exists and is inactive, reactivate it
    if (existing && !existing.isActive) {
      existing.isActive = true;
      existing.staffQuota = createDto.staffQuota || 0;
      existing.guestQuota = createDto.guestQuota || 0;
      existing.scholarshipQuota = createDto.scholarshipQuota || 0;
      existing.updatedBy = userObjectId;

      const saved = await existing.save();
      const populated = await this.eventSponsorModel
        .findById(saved._id)
        .populate('company')
        .exec();

      return toDto(populated!, EventSponsorDto);
    }

    // If exists and is active, throw error
    if (existing && existing.isActive) {
      throw new ConflictException(
        'This company is already a sponsor for this event',
      );
    }

    // Create new sponsor
    const sponsor = new this.eventSponsorModel({
      eventId: eventObjectId,
      companyId: companyObjectId,
      staffQuota: createDto.staffQuota || 0,
      guestQuota: createDto.guestQuota || 0,
      scholarshipQuota: createDto.scholarshipQuota || 0,
      staffUsed: 0,
      guestUsed: 0,
      scholarshipUsed: 0,
      assignedBy: userObjectId,
      assignedAt: new Date(),
    });

    const saved = await sponsor.save();
    const populated = await this.eventSponsorModel
      .findById(saved._id)
      .populate('company')
      .exec();

    return toDto(populated!, EventSponsorDto);
  }

  async updateSponsorQuotas(
    sponsorId: string,
    updateDto: UpdateEventSponsorDto,
    userId: string,
  ): Promise<EventSponsorDto> {
    const sponsor = await this.eventSponsorModel.findById(
      new Types.ObjectId(sponsorId),
    );

    if (!sponsor) {
      throw new NotFoundException('Event sponsor not found');
    }

    if (updateDto.staffQuota !== undefined) {
      sponsor.staffQuota = updateDto.staffQuota;
    }
    if (updateDto.guestQuota !== undefined) {
      sponsor.guestQuota = updateDto.guestQuota;
    }
    if (updateDto.scholarshipQuota !== undefined) {
      sponsor.scholarshipQuota = updateDto.scholarshipQuota;
    }
    if (updateDto.isActive !== undefined) {
      sponsor.isActive = updateDto.isActive;
    }

    sponsor.updatedBy = new Types.ObjectId(userId);

    const saved = await sponsor.save();
    const populated = await this.eventSponsorModel
      .findById(saved._id)
      .populate('company')
      .exec();

    return toDto(populated!, EventSponsorDto);
  }

  async getSponsorsByEvent(eventId: string): Promise<EventSponsorDto[]> {
    const sponsors = await this.eventSponsorModel
      .find({ eventId: new Types.ObjectId(eventId), isActive: true })
      .populate('company')
      .sort({ assignedAt: -1 })
      .exec();

    return sponsors.map((s) => toDto(s, EventSponsorDto));
  }

  async getSponsorDetails(sponsorId: string): Promise<EventSponsorDto> {
    const sponsor = await this.eventSponsorModel
      .findById(new Types.ObjectId(sponsorId))
      .populate('company')
      .exec();

    if (!sponsor) {
      throw new NotFoundException('Event sponsor not found');
    }

    return toDto(sponsor, EventSponsorDto);
  }

  async removeSponsor(
    sponsorId: string,
    userId: string,
  ): Promise<EventSponsorDto> {
    const sponsor = await this.eventSponsorModel.findById(
      new Types.ObjectId(sponsorId),
    );

    if (!sponsor) {
      throw new NotFoundException('Event sponsor not found');
    }

    if (!sponsor.isActive) {
      throw new BadRequestException('Sponsor is already inactive');
    }

    sponsor.isActive = false;
    sponsor.updatedBy = new Types.ObjectId(userId);

    const saved = await sponsor.save();
    const populated = await this.eventSponsorModel
      .findById(saved._id)
      .populate('company')
      .exec();

    return toDto(populated!, EventSponsorDto);
  }

  async checkQuotaAvailability(
    sponsorId: string,
    participantType: ParticipantType,
    quantity: number = 1,
  ): Promise<boolean> {
    const sponsor = await this.eventSponsorModel.findById(
      new Types.ObjectId(sponsorId),
    );

    if (!sponsor || !sponsor.isActive) {
      throw new NotFoundException('Event sponsor not found or inactive');
    }

    switch (participantType) {
      case ParticipantType.STAFF:
        return sponsor.staffQuota - sponsor.staffUsed >= quantity;
      case ParticipantType.GUEST:
        return sponsor.guestQuota - sponsor.guestUsed >= quantity;
      case ParticipantType.SCHOLARSHIP:
        return sponsor.scholarshipQuota - sponsor.scholarshipUsed >= quantity;
      default:
        return true;
    }
  }

  async incrementQuotaUsage(
    sponsorId: string,
    participantType: ParticipantType,
  ): Promise<void> {
    const sponsor = await this.eventSponsorModel.findById(
      new Types.ObjectId(sponsorId),
    );

    if (!sponsor) {
      throw new NotFoundException('Event sponsor not found');
    }

    switch (participantType) {
      case ParticipantType.STAFF:
        if (sponsor.staffUsed >= sponsor.staffQuota) {
          throw new BadRequestException('Staff quota exceeded');
        }
        sponsor.staffUsed += 1;
        break;
      case ParticipantType.GUEST:
        if (sponsor.guestUsed >= sponsor.guestQuota) {
          throw new BadRequestException('Guest quota exceeded');
        }
        sponsor.guestUsed += 1;
        break;
      case ParticipantType.SCHOLARSHIP:
        if (sponsor.scholarshipUsed >= sponsor.scholarshipQuota) {
          throw new BadRequestException('Scholarship quota exceeded');
        }
        sponsor.scholarshipUsed += 1;
        break;
      default:
        return;
    }

    await sponsor.save();
  }

  async decrementQuotaUsage(
    sponsorId: string,
    participantType: ParticipantType,
  ): Promise<void> {
    const sponsor = await this.eventSponsorModel.findById(
      new Types.ObjectId(sponsorId),
    );

    if (!sponsor) {
      throw new NotFoundException('Event sponsor not found');
    }

    switch (participantType) {
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
        return;
    }

    await sponsor.save();
  }

  async findBySponsorId(
    sponsorId: string,
  ): Promise<EventSponsorDocument | null> {
    return await this.eventSponsorModel
      .findById(new Types.ObjectId(sponsorId))
      .exec();
  }

  async findByCompanyId(companyId: string): Promise<EventSponsorDocument[]> {
    return await this.eventSponsorModel
      .find({ companyId: new Types.ObjectId(companyId), isActive: true })
      .exec();
  }
}
