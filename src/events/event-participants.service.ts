import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EventParticipant,
  EventParticipantDocument,
} from './entities/event-participant.entity';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { EventParticipantDto } from './dto/event-participant.dto';
import { AssignOperationalStaffDto } from './dto/assign-operational-staff.dto';
import { EventSponsorsService } from './event-sponsors.service';
import { ParticipantType } from '../common/enums/participant-type.enum';
import { Event, EventDocument } from './entities/event.entity';
import { toDto } from '../utils/toDto';

@Injectable()
export class EventParticipantsService {
  constructor(
    @InjectModel(EventParticipant.name)
    private eventParticipantModel: Model<EventParticipantDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    private eventSponsorsService: EventSponsorsService,
  ) { }

  async registerParticipant(
    eventId: string,
    registerDto: RegisterParticipantDto,
  ): Promise<EventParticipantDto> {
    const eventObjectId = new Types.ObjectId(eventId);
    const userObjectId = new Types.ObjectId(registerDto.userId);

    // Check if user is already registered for this event
    const existing = await this.eventParticipantModel.findOne({
      eventId: eventObjectId,
      userId: userObjectId,
      isActive: true,
    });

    if (existing) {
      throw new ConflictException('User is already registered for this event');
    }

    // Check quota availability if using sponsor quota
    if (registerDto.participantType !== ParticipantType.REGULAR) {
      const hasQuota = await this.eventSponsorsService.checkQuotaAvailability(
        registerDto.eventSponsorId,
        registerDto.participantType,
      );

      if (!hasQuota) {
        throw new BadRequestException(
          `No available ${registerDto.participantType} quota for this sponsor`,
        );
      }
    }

    const participant = new this.eventParticipantModel({
      eventId: eventObjectId,
      userId: userObjectId,
      eventSponsorId: registerDto.eventSponsorId
        ? new Types.ObjectId(registerDto.eventSponsorId)
        : undefined,
      participantType: registerDto.participantType,
      registeredAt: new Date(),
    });

    const saved = await participant.save();

    if (registerDto.participantType !== ParticipantType.REGULAR) {
      await this.eventSponsorsService.incrementQuotaUsage(
        registerDto.eventSponsorId,
        registerDto.participantType,
      );
    }

    const populated = await this.eventParticipantModel
      .findById(saved._id)
      .populate({
        path: 'user',
        populate: { path: 'person' },
      })
      .populate({
        path: 'sponsor',
        populate: { path: 'company' },
      })
      .populate({
        path: 'speaker',
        populate: [{ path: 'person' }, { path: 'companyId' }],
      })
      .exec();

    return toDto(populated!, EventParticipantDto);
  }

  async getParticipantsByEvent(
    eventId: string,
    options?: {
      page?: number;
      limit?: number;
      sponsorId?: string;
      participantType?: string;
      isActive?: boolean;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ): Promise<{
    data: EventParticipantDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;
    const sortBy = options?.sortBy || 'registeredAt';
    const sortOrder = options?.sortOrder === 'asc' ? 1 : -1;

    // Build filter query
    const filter: any = { eventId: new Types.ObjectId(eventId) };

    if (options?.sponsorId) {
      filter.eventSponsorId = new Types.ObjectId(options.sponsorId);
    }

    if (options?.participantType) {
      filter.participantType = options.participantType;
    }

    if (options?.isActive !== undefined) {
      filter.isActive = options.isActive;
    }

    // If search is provided, we need to populate user first and filter
    const query = this.eventParticipantModel.find(filter);

    // Get total count for pagination
    const total = await this.eventParticipantModel.countDocuments(filter);

    // Apply sorting, pagination, and population
    const participants = await query
      .populate({
        path: 'user',
        populate: { path: 'person' },
      })
      .populate({
        path: 'sponsor',
        populate: { path: 'company' },
      })
      .populate({
        path: 'speaker',
        populate: [{ path: 'person' }, { path: 'companyId' }],
      })
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit)
      .exec();

    // Apply search filter if provided (post-query filtering for populated fields)
    let filteredParticipants = participants;
    if (options?.search) {
      const searchLower = options.search.toLowerCase();
      filteredParticipants = participants.filter((p: any) => {
        const user = p.user;
        if (!user) return false;

        const email = user.email?.toLowerCase() || '';
        const firstName = user.firstName?.toLowerCase() || '';
        const lastName = user.lastName?.toLowerCase() || '';
        const fullName = `${firstName} ${lastName}`.trim();

        return (
          email.includes(searchLower) ||
          firstName.includes(searchLower) ||
          lastName.includes(searchLower) ||
          fullName.includes(searchLower)
        );
      });
    }

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: filteredParticipants.map((p) => toDto(p, EventParticipantDto)),
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };
  }

  async getParticipantsBySponsor(
    eventSponsorId: string,
  ): Promise<EventParticipantDto[]> {
    const participants = await this.eventParticipantModel
      .find({
        eventSponsorId: new Types.ObjectId(eventSponsorId),
        isActive: true,
      })
      .populate({
        path: 'user',
        populate: { path: 'person' },
      })
      .populate({
        path: 'sponsor',
        populate: { path: 'company' },
      })
      .populate({
        path: 'speaker',
        populate: [{ path: 'person' }, { path: 'companyId' }],
      })
      .sort({ registeredAt: -1 })
      .exec();

    return participants.map((p) => toDto(p, EventParticipantDto));
  }

  async getParticipantByUserAndEvent(
    userId: string,
    eventId: string,
  ): Promise<EventParticipantDto | null> {
    const participant = await this.eventParticipantModel
      .findOne({
        userId: new Types.ObjectId(userId),
        eventId: new Types.ObjectId(eventId),
        isActive: true,
      })
      .populate({
        path: 'user',
        populate: { path: 'person' },
      })
      .populate({
        path: 'sponsor',
        populate: { path: 'company' },
      })
      .populate({
        path: 'speaker',
        populate: [{ path: 'person' }, { path: 'companyId' }],
      })
      .exec();

    return participant ? toDto(participant, EventParticipantDto) : null;
  }

  async cancelParticipation(
    participantId: string,
    userId: string,
  ): Promise<EventParticipantDto> {
    const participant = await this.eventParticipantModel.findById(
      new Types.ObjectId(participantId),
    );

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    if (!participant.isActive) {
      throw new BadRequestException('Participant is already cancelled');
    }

    participant.isActive = false;
    participant.cancelledAt = new Date();
    participant.cancelledBy = new Types.ObjectId(userId);

    const saved = await participant.save();

    // Decrement quota usage if applicable
    if (
      participant.eventSponsorId &&
      participant.participantType !== ParticipantType.REGULAR
    ) {
      await this.eventSponsorsService.decrementQuotaUsage(
        participant.eventSponsorId.toString(),
        participant.participantType,
      );
    }

    const populated = await this.eventParticipantModel
      .findById(saved._id)
      .populate({
        path: 'user',
        populate: { path: 'person' },
      })
      .populate({
        path: 'sponsor',
        populate: { path: 'company' },
      })
      .populate({
        path: 'speaker',
        populate: [{ path: 'person' }, { path: 'companyId' }],
      })
      .exec();

    return toDto(populated!, EventParticipantDto);
  }

  async checkStaffAccess(userId: string, eventId: string): Promise<boolean> {
    const participant = await this.eventParticipantModel.findOne({
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
      participantType: ParticipantType.STAFF,
      isActive: true,
    });

    if (!participant) {
      return false;
    }

    const event = await this.eventModel.findById(new Types.ObjectId(eventId));

    if (!event) {
      return false;
    }

    const now = new Date();
    return now >= event.startDate && now <= event.endDate;
  }

  async getStaffByEvent(eventId: string): Promise<EventParticipantDto[]> {
    const staff = await this.eventParticipantModel
      .find({
        eventId: new Types.ObjectId(eventId),
        participantType: ParticipantType.STAFF,
        isActive: true,
      })
      .populate({
        path: 'user',
        populate: { path: 'person' },
      })
      .populate({
        path: 'sponsor',
        populate: { path: 'company' },
      })
      .populate({
        path: 'speaker',
        populate: [{ path: 'person' }, { path: 'companyId' }],
      })
      .sort({ registeredAt: -1 })
      .exec();

    return staff.map((s) => toDto(s, EventParticipantDto));
  }

  async updateParticipantTicket(
    participantId: string,
    ticketId: string,
  ): Promise<void> {
    await this.eventParticipantModel.updateOne(
      { _id: new Types.ObjectId(participantId) },
      { $set: { ticketId: new Types.ObjectId(ticketId) } },
    );
  }

  async assignOperationalStaff(
    eventId: string,
    dto: AssignOperationalStaffDto,
  ): Promise<EventParticipantDto> {
    const eventObjectId = new Types.ObjectId(eventId);
    const userObjectId = new Types.ObjectId(dto.userId);

    const event = await this.eventModel.findById(eventObjectId);
    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    const existing = await this.eventParticipantModel.findOne({
      eventId: eventObjectId,
      userId: userObjectId,
      participantType: ParticipantType.OPERATIONAL_STAFF,
      isActive: true,
    });

    if (existing) {
      throw new ConflictException(
        'El usuario ya está asignado como staff operativo de este evento',
      );
    }

    // Crear asignación
    const participant = new this.eventParticipantModel({
      eventId: eventObjectId,
      userId: userObjectId,
      participantType: ParticipantType.OPERATIONAL_STAFF,
      isActive: true,
      registeredAt: new Date(),
    });

    const saved = await participant.save();
    const populated = await this.eventParticipantModel
      .findById(saved._id)
      .populate('user')
      .populate('event')
      .exec();

    return toDto(populated!, EventParticipantDto);
  }

  async getOperationalStaffByEvent(
    eventId: string,
  ): Promise<EventParticipantDto[]> {
    const staff = await this.eventParticipantModel
      .find({
        eventId: new Types.ObjectId(eventId),
        participantType: ParticipantType.OPERATIONAL_STAFF,
        isActive: true,
      })
      .populate('user')
      .populate('event')
      .sort({ registeredAt: -1 })
      .exec();

    return staff.map((s) => toDto(s, EventParticipantDto));
  }

  async removeOperationalStaff(
    eventId: string,
    participantId: string,
  ): Promise<void> {
    const participant = await this.eventParticipantModel.findOne({
      _id: new Types.ObjectId(participantId),
      eventId: new Types.ObjectId(eventId),
      participantType: ParticipantType.OPERATIONAL_STAFF,
    });

    if (!participant) {
      throw new NotFoundException('Staff operativo no encontrado');
    }

    participant.isActive = false;
    participant.cancelledAt = new Date();
    await participant.save();
  }


  async syncSpeakersAsParticipants(
    eventId: string,
    speakerIds: string[],
  ): Promise<void> {
    const eventObjectId = new Types.ObjectId(eventId);

    const currentParticipants = await this.eventParticipantModel.find({
      eventId: eventObjectId,
      participantType: ParticipantType.SPEAKER,
      isActive: true,
    });

    const currentSpeakerIds = currentParticipants.map((p) =>
      p.speakerId?.toString(),
    );
    const newSpeakerIds = speakerIds.map((id) => id.toString());

    const removedSpeakerIds = currentSpeakerIds.filter(
      (id) => id && !newSpeakerIds.includes(id),
    );

    if (removedSpeakerIds.length > 0) {
      await this.eventParticipantModel.updateMany(
        {
          eventId: eventObjectId,
          speakerId: {
            $in: removedSpeakerIds.map((id) => new Types.ObjectId(id)),
          },
          participantType: ParticipantType.SPEAKER,
        },
        {
          $set: { isActive: false, cancelledAt: new Date() },
        },
      );
    }

    const speakersToAdd = newSpeakerIds.filter(
      (id) => !currentSpeakerIds.includes(id),
    );

    for (const speakerId of speakersToAdd) {
      const existing = await this.eventParticipantModel.findOne({
        eventId: eventObjectId,
        speakerId: new Types.ObjectId(speakerId),
        participantType: ParticipantType.SPEAKER,
      });

      if (existing) {
        if (!existing.isActive) {
          existing.isActive = true;
          existing.cancelledAt = undefined;
          await existing.save();
        }
      } else {
        await this.eventParticipantModel.create({
          eventId: eventObjectId,
          speakerId: new Types.ObjectId(speakerId),
          participantType: ParticipantType.SPEAKER,
          registeredAt: new Date(),
          isActive: true,
        });
      }
    }
  }
}
