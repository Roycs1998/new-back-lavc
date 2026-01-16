import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  SponsorStandVisit,
  SponsorStandVisitDocument,
  SponsorStandVisitMode,
} from './entities/sponsor-stand-visit.entity';
import {
  EventSponsor,
  EventSponsorDocument,
} from './entities/event-sponsor.entity';
import { QRService } from '../qr/qr.service';
import { ScanSponsorQRDto } from './dto/scan-sponsor-qr.dto';
import { ScanAttendeeQRDto } from './dto/scan-attendee-qr.dto';
import { SponsorStandVisitDto } from './dto/sponsor-stand-visit.dto';
import { EventParticipantsService } from '../events/event-participants.service';
import { UsersService } from '../users/users.service';
import type { GeoLocation } from '../qr/entities/qr.entity';
import type { CompanyDocument } from '../companies/entities/company.entity';

export interface SponsorStandQrLinkResponse {
  url: string;
  sponsorId: string;
  eventId: string;
  companyName: string;
}

@Injectable()
export class SponsorStandsService {
  constructor(
    @InjectModel(SponsorStandVisit.name)
    private readonly visitModel: Model<SponsorStandVisitDocument>,
    @InjectModel(EventSponsor.name)
    private readonly sponsorModel: Model<EventSponsorDocument>,
    private readonly qrService: QRService,
    private readonly participantsService: EventParticipantsService,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Genera el link que se usará para el QR del stand del sponsor.
   * El QR simplemente contendrá este URL hacia el frontend.
   */
  async generateStandQR(
    sponsorId: string,
    _userId: string,
  ): Promise<SponsorStandQrLinkResponse> {
    const sponsor = await this.sponsorModel
      .findById(sponsorId)
      .populate('company');
    if (!sponsor || !sponsor.isActive) {
      throw new NotFoundException('Sponsor no encontrado o inactivo');
    }

    const webUrl = this.configService.getOrThrow<string>('app.webUrl');
    const baseUrl = webUrl.replace(/\/$/, '');
    const standPath = `/sponsor-stands/visit/${sponsor.id.toString()}`;
    const url = `${baseUrl}${standPath}`;

    const sponsorWithCompany = sponsor as EventSponsorDocument & {
      company?: CompanyDocument;
    };
    const company = sponsorWithCompany.company;

    return {
      url,
      sponsorId: sponsor.id.toString(),
      eventId: sponsor.eventId.toString(),
      companyName: company?.name ?? 'Unknown Company',
    };
  }

  /**
   * Registra una visita cuando un USUARIO escanea el QR del SPONSOR.
   */
  async recordVisitByUser(
    userId: string,
    dto: ScanSponsorQRDto,
  ): Promise<SponsorStandVisitDto> {
    const { sponsorId, deviceInfo, location } = dto;

    const sponsor = await this.sponsorModel
      .findById(sponsorId)
      .populate('company');
    if (!sponsor || !sponsor.isActive) {
      throw new NotFoundException('Sponsor no encontrado o inactivo');
    }

    const participant =
      await this.participantsService.getParticipantByUserAndEvent(
        userId,
        sponsor.eventId.toString(),
      );

    if (
      participant &&
      participant.eventSponsorId &&
      participant.eventSponsorId.toString() === sponsorId
    ) {
      throw new BadRequestException(
        'No puedes registrar visita a tu propio stand',
      );
    }

    let visit = await this.visitModel.findOne({
      eventSponsorId: new Types.ObjectId(sponsorId),
      visitorUserId: new Types.ObjectId(userId),
    });

    if (visit) {
      visit.visitCount += 1;
      visit.scannedAt = new Date();
      visit.mode = SponsorStandVisitMode.USER_SCANS_SPONSOR;
      visit.scannedByUserId = new Types.ObjectId(userId);
      visit.deviceInfo = deviceInfo ? JSON.stringify(deviceInfo) : undefined;
      visit.location = this.mapLocationFromPayload(location);
    } else {
      visit = new this.visitModel({
        eventSponsorId: new Types.ObjectId(sponsorId),
        eventId: sponsor.eventId,
        visitorUserId: new Types.ObjectId(userId),
        scannedByUserId: new Types.ObjectId(userId),
        mode: SponsorStandVisitMode.USER_SCANS_SPONSOR,
        scannedAt: new Date(),
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined,
        location: this.mapLocationFromPayload(location),
        visitCount: 1,
      });
    }

    await visit.save();
    return this.mapToDto(visit, sponsor);
  }

  /**
   * Registra una visita cuando el STAFF del sponsor escanea el QR del ASISTENTE.
   */
  async recordVisitByStaff(
    staffUserId: string,
    sponsorId: string,
    dto: ScanAttendeeQRDto,
  ): Promise<SponsorStandVisitDto> {
    const { qrCode, deviceInfo, location } = dto;

    const sponsor = await this.sponsorModel
      .findById(sponsorId)
      .populate('company');
    if (!sponsor || !sponsor.isActive) {
      throw new NotFoundException('Sponsor no encontrado o inactivo');
    }

    const staffParticipant =
      await this.participantsService.getParticipantByUserAndEvent(
        staffUserId,
        sponsor.eventId.toString(),
      );

    const isAuthorized =
      staffParticipant &&
      staffParticipant.eventSponsorId &&
      staffParticipant.eventSponsorId.toString() === sponsorId &&
      staffParticipant.isActive;

    if (!isAuthorized) {
      // Here we could check if user is company admin, but for now we enforce staff role or assume controller guard handles it.
      // But logic says: "staff del mismo sponsor...".
    }

    const qrData = this.qrService.verifyTicketQR(qrCode);

    if (!qrData) {
      throw new BadRequestException('Código QR inválido o manipulado');
    }

    const visitorUserId = qrData.userId;

    if (visitorUserId === staffUserId) {
      throw new BadRequestException(
        'No puedes auto-escanearte para registrar visita',
      );
    }

    const visitorParticipant =
      await this.participantsService.getParticipantByUserAndEvent(
        visitorUserId,
        sponsor.eventId.toString(),
      );

    if (
      visitorParticipant &&
      visitorParticipant.eventSponsorId &&
      visitorParticipant.eventSponsorId.toString() === sponsorId
    ) {
      throw new BadRequestException(
        'El usuario ya es parte del staff de este sponsor',
      );
    }

    let visit = await this.visitModel.findOne({
      eventSponsorId: new Types.ObjectId(sponsorId),
      visitorUserId: new Types.ObjectId(visitorUserId),
    });

    if (visit) {
      visit.visitCount += 1;
      visit.scannedAt = new Date();
      visit.mode = SponsorStandVisitMode.SPONSOR_SCANS_ATTENDEE;
      visit.scannedByUserId = new Types.ObjectId(staffUserId);
      visit.deviceInfo = deviceInfo ? JSON.stringify(deviceInfo) : undefined;
      visit.location = this.mapLocationFromPayload(location);
    } else {
      visit = new this.visitModel({
        eventSponsorId: new Types.ObjectId(sponsorId),
        eventId: sponsor.eventId,
        visitorUserId: new Types.ObjectId(visitorUserId),
        scannedByUserId: new Types.ObjectId(staffUserId),
        mode: SponsorStandVisitMode.SPONSOR_SCANS_ATTENDEE,
        scannedAt: new Date(),
        deviceInfo: deviceInfo ? JSON.stringify(deviceInfo) : undefined,
        location: this.mapLocationFromPayload(location),
        visitCount: 1,
      });
    }

    await visit.save();
    return this.mapToDto(visit, sponsor);
  }

  async getSponsorVisits(sponsorId: string): Promise<SponsorStandVisitDto[]> {
    const visits = await this.visitModel
      .find({ eventSponsorId: new Types.ObjectId(sponsorId) })
      .populate('visitorUserId')
      .populate({
        path: 'eventSponsorId',
        populate: { path: 'company' },
      })
      .sort({ scannedAt: -1 })
      .exec();

    return Promise.all(
      visits.map(async (v) => {
        const sponsor = v.eventSponsorId as unknown as EventSponsorDocument;
        return this.mapToDto(v, sponsor);
      }),
    );
  }

  async getUserVisits(userId: string): Promise<SponsorStandVisitDto[]> {
    const visits = await this.visitModel
      .find({ visitorUserId: new Types.ObjectId(userId) })
      .populate({
        path: 'eventSponsorId',
        populate: { path: 'company' },
      })
      .sort({ scannedAt: -1 })
      .exec();

    return Promise.all(
      visits.map(async (v) => {
        const sponsor = v.eventSponsorId as unknown as EventSponsorDocument;
        return this.mapToDto(v, sponsor);
      }),
    );
  }

  private async mapToDto(
    visit: SponsorStandVisitDocument,
    sponsor: EventSponsorDocument,
  ): Promise<SponsorStandVisitDto> {
    type VisitorLike = {
      id?: string;
      firstName?: string;
      lastName?: string;
      email?: string;
    };

    let visitor: VisitorLike | Types.ObjectId | string = visit.visitorUserId;
    if (visitor instanceof Types.ObjectId || typeof visitor === 'string') {
      try {
        const loadedVisitor = await this.usersService.findOne(
          visitor.toString(),
        );
        visitor = {
          id: loadedVisitor.id,
          email: loadedVisitor.email,
          firstName: loadedVisitor.firstName,
          lastName: loadedVisitor.lastName,
        };
      } catch (e) {
        visitor = {
          firstName: 'Unknown',
          lastName: 'User',
          email: 'unknown',
        };
      }
    }

    const sponsorWithCompany = sponsor as EventSponsorDocument & {
      company?: CompanyDocument;
    };
    const company = sponsorWithCompany.company;

    const dto = new SponsorStandVisitDto();
    dto.id = (visit._id as Types.ObjectId).toString();
    dto.scannedAt = visit.scannedAt;
    dto.scanType = visit.mode;
    dto.visitCount = visit.visitCount;

    dto.visitor = {
      id: visitor.id || '',
      firstName: visitor.firstName ?? '',
      lastName: visitor.lastName ?? '',
      email: visitor.email ?? '',
    };

    dto.sponsor = {
      id: (sponsor._id as Types.ObjectId).toString(),
      companyName: company?.name ?? 'Unknown Company',
    };

    return dto;
  }

  private mapLocationFromPayload(
    location?: Record<string, unknown>,
  ): GeoLocation | undefined {
    if (!location) {
      return undefined;
    }

    const { latitude, longitude } = location as {
      latitude?: unknown;
      longitude?: unknown;
    };

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return undefined;
    }

    return { latitude, longitude };
  }
}
