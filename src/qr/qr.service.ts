import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { ConfigService } from '@nestjs/config';
import { EntryStatus } from '../common/enums/entry-status.enum';
import { EntityStatus } from '../common/enums/entity-status.enum';
import { GenerateQRDto } from './dto/generate-qr.dto';
import { ValidateQRDto } from './dto/validate-qr.dto';
import { QRResponseDto, ValidationResponseDto } from './dto/qr-response.dto';
import { EntryLog, EntryLogDocument } from './entities/qr.entity';
import { Ticket, TicketDocument } from 'src/tickets/entities/ticket.entity';
import { TicketLifecycleStatus } from 'src/common/enums/ticket-lifecycle-status.enum';

@Injectable()
export class QRService {
  private readonly QR_SECRET: string;

  constructor(
    @InjectModel(EntryLog.name) private entryLogModel: Model<EntryLogDocument>,
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    private configService: ConfigService,
  ) {
    this.QR_SECRET = this.configService.getOrThrow<string>('app.qrSecret');
  }

  async generateQRCode(
    generateQRDto: GenerateQRDto,
    userId: string | Types.ObjectId,
  ): Promise<QRResponseDto> {
    const { ticketId } = generateQRDto;

    const ticketObjectId =
      typeof ticketId === 'string' ? new Types.ObjectId(ticketId) : ticketId;

    const ticket = await this.ticketModel
      .findById(ticketObjectId)
      .populate('eventId')
      .populate('ticketTypeId')
      .populate('userId')
      .lean();

    if (!ticket || ticket.entityStatus === EntityStatus.DELETED) {
      throw new NotFoundException('Ticket no encontrado');
    }

    if (ticket.userId.toString() !== userId.toString()) {
      throw new BadRequestException(
        'No tienes permisos para generar QR de este ticket',
      );
    }

    if (ticket.status !== TicketLifecycleStatus.ACTIVE) {
      throw new BadRequestException('El ticket no está activo');
    }

    const qrData = this.createQRData(ticket);
    const qrString = this.signQRData(qrData);

    const qrDataUrl = await QRCode.toDataURL(qrString, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return {
      qrCode: qrString,
      qrDataUrl,
      ticketInfo: {
        id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        eventTitle: (ticket.eventId as any).title,
        eventDate: (ticket.eventId as any).startDate,
        attendeeName: `${ticket.attendeeInfo.firstName} ${ticket.attendeeInfo.lastName}`,
        ticketType: (ticket.ticketTypeId as any).name,
        price: ticket.price,
      },
      generatedAt: new Date(),
    };
  }

  async validateQRCode(
    validateQRDto: ValidateQRDto,
    validatorUserId: Types.ObjectId,
    ipAddress?: string,
  ): Promise<ValidationResponseDto> {
    const { qrCode, validationNotes, deviceInfo, location } = validateQRDto;

    try {
      const qrData = this.verifyQRSignature(qrCode);

      if (!qrData) {
        return this.createValidationResponse(
          EntryStatus.INVALID_SIGNATURE,
          'Código QR inválido o manipulado',
        );
      }

      const ticket = await this.ticketModel
        .findById(qrData.ticketId)
        .populate('eventId')
        .populate('ticketTypeId')
        .populate('userId')
        .lean();

      if (!ticket || ticket.entityStatus === EntityStatus.DELETED) {
        return this.createValidationResponse(
          EntryStatus.INVALID_TICKET,
          'Ticket no encontrado',
        );
      }

      const event = ticket.eventId as any;

      if (!this.verifyQRFreshness(qrData, ticket)) {
        return this.createValidationResponse(
          EntryStatus.INVALID_TICKET,
          'Código QR desactualizado',
        );
      }

      const ticketJson = ticket.toJSON();

      const alreadyUsed = await this.isTicketAlreadyUsed(ticketJson._id);
      if (alreadyUsed) {
        const response = this.createValidationResponse(
          EntryStatus.ALREADY_USED,
          'Este ticket ya fue utilizado',
        );
        response.ticketInfo = this.createTicketInfo(ticket, true);
        return response;
      }

      const timeValidation = this.validateEventTiming(event);
      if (timeValidation.status !== EntryStatus.ALLOWED) {
        return timeValidation;
      }

      const response = this.createValidationResponse(
        EntryStatus.ALLOWED,
        'Entrada permitida',
      );
      response.ticketInfo = this.createTicketInfo(ticket, false);

      const deviceInfoString = deviceInfo
        ? JSON.stringify(deviceInfo)
        : undefined;

      await this.logEntry(
        event._id,
        ticketJson._id,
        ticket.userId._id,
        EntryStatus.ALLOWED,
        validatorUserId,
        validationNotes,
        deviceInfoString,
        ipAddress,
        location,
        qrData,
      );

      return response;
    } catch (error) {
      const deviceInfoString = deviceInfo
        ? JSON.stringify(deviceInfo)
        : undefined;

      await this.logFailedEntry(
        validatorUserId,
        qrCode,
        ipAddress,
        deviceInfoString,
        error.message,
      );

      return this.createValidationResponse(
        EntryStatus.INVALID_TICKET,
        'Error al validar QR: ' + error.message,
      );
    }
  }

  async getEventEntryStats(eventId: string) {
    const eventObjectId = new Types.ObjectId(eventId);

    const stats = await this.entryLogModel.aggregate([
      { $match: { eventId: eventObjectId } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAttempts = stats.reduce((sum, stat) => sum + stat.count, 0);
    const allowed =
      stats.find((s) => s._id === EntryStatus.ALLOWED)?.count || 0;

    return {
      eventId,
      totalAttempts,
      successfulEntries: allowed,
      failedAttempts: totalAttempts - allowed,
      successRate:
        totalAttempts > 0
          ? ((allowed / totalAttempts) * 100).toFixed(2) + '%'
          : '0%',
      breakdown: stats,
      lastActivity: await this.getLastActivityTime(eventObjectId),
    };
  }

  async getEventEntryLogs(eventId: Types.ObjectId, limit = 50) {
    return this.entryLogModel
      .find({ eventId })
      .populate('ticketId', 'ticketNumber')
      .populate('attendeeId', 'firstName lastName')
      .populate('validatedBy', 'firstName lastName')
      .sort({ validatedAt: -1 })
      .limit(limit)
      .lean();
  }

  async getValidationHistory(ticketId: string) {
    const logs = await this.entryLogModel
      .find({ ticketId: new Types.ObjectId(ticketId) })
      .populate('validatedBy', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .lean();

    return {
      ticketId,
      totalAttempts: logs.length,
      successfulEntries: logs.filter(
        (log) => log.status === EntryStatus.ALLOWED,
      ).length,
      failedAttempts: logs.filter((log) => log.status !== EntryStatus.ALLOWED)
        .length,
      history: logs.map((log) => ({
        status: log.status,
        message: this.getStatusMessage(log.status),
        timestamp: log.toJSON().createdAt,
        validatedBy: log.validatedBy,
        ipAddress: log.ipAddress,
        deviceInfo: log.deviceInfo,
        location: log.location,
      })),
    };
  }

  async generateQRForTicket(
    ticket: any,
  ): Promise<{ qrCode: string; qrDataUrl: string }> {
    const qrData = this.createQRData(ticket);
    const qrCode = this.signQRData(qrData);

    const qrDataUrl = await QRCode.toDataURL(qrCode, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });

    return { qrCode, qrDataUrl };
  }

  private createQRData(ticket: any): any {
    return {
      ticketId: ticket._id.toString(),
      eventId: ticket.eventId._id
        ? ticket.eventId._id.toString()
        : ticket.eventId.toString(),
      userId: ticket.userId._id
        ? ticket.userId._id.toString()
        : ticket.userId.toString(),
      ticketNumber: ticket.ticketNumber,
      price: ticket.price,
      createdAt: ticket.createdAt,
      timestamp: Date.now(),
      version: '1.0',
    };
  }

  private signQRData(qrData: any): string {
    const dataString = JSON.stringify(qrData);
    const signature = crypto
      .createHmac('sha256', this.QR_SECRET)
      .update(dataString)
      .digest('hex');

    const signedData = {
      data: qrData,
      signature,
    };

    return Buffer.from(JSON.stringify(signedData)).toString('base64');
  }

  verifyTicketQR(qrCode: string): any {
    return this.verifyQRSignature(qrCode);
  }

  private verifyQRSignature(qrCode: string): any | null {
    try {
      const decoded = JSON.parse(Buffer.from(qrCode, 'base64').toString());
      const { data, signature } = decoded;

      const expectedSignature = crypto
        .createHmac('sha256', this.QR_SECRET)
        .update(JSON.stringify(data))
        .digest('hex');

      if (signature === expectedSignature) {
        return data;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private verifyQRFreshness(qrData: any, ticket: any): boolean {
    return (
      qrData.ticketId === ticket._id.toString() &&
      qrData.ticketNumber === ticket.ticketNumber &&
      qrData.price === ticket.price
    );
  }

  private async isTicketAlreadyUsed(
    ticketId: Types.ObjectId,
  ): Promise<boolean> {
    const entryLog = await this.entryLogModel.findOne({
      ticketId,
      status: EntryStatus.ALLOWED,
    });

    return !!entryLog;
  }

  private validateEventTiming(event: any): ValidationResponseDto {
    const now = new Date();

    const eventStart = new Date(event.startDate);
    const allowEntryFrom = new Date(eventStart.getTime() - 30 * 60 * 1000);

    if (now < allowEntryFrom) {
      return this.createValidationResponse(
        EntryStatus.EVENT_NOT_STARTED,
        `El evento no ha comenzado. Entrada permitida desde ${allowEntryFrom.toLocaleTimeString()}`,
      );
    }

    if (event.endDate) {
      const eventEnd = new Date(event.endDate);
      const allowEntryUntil = new Date(eventEnd.getTime() + 2 * 60 * 60 * 1000);

      if (now > allowEntryUntil) {
        return this.createValidationResponse(
          EntryStatus.EVENT_ENDED,
          'El evento ya ha terminado',
        );
      }
    }

    return this.createValidationResponse(EntryStatus.ALLOWED, 'Timing válido');
  }

  private async logEntry(
    eventId: Types.ObjectId,
    ticketId: Types.ObjectId,
    attendeeId: Types.ObjectId,
    status: EntryStatus,
    validatorId: Types.ObjectId,
    notes?: string,
    deviceInfo?: string,
    ipAddress?: string,
    location?: any,
    qrData?: any,
  ): Promise<void> {
    const entryLog = new this.entryLogModel({
      eventId,
      ticketId,
      attendeeId,
      status,
      validatedBy: validatorId,
      validationNotes: notes,
      deviceInfo,
      ipAddress,
      location,
      validatedAt: new Date(),
      qrDataHash: qrData
        ? crypto
            .createHash('sha256')
            .update(JSON.stringify(qrData))
            .digest('hex')
        : undefined,
    });

    await entryLog.save();
  }

  private async logFailedEntry(
    validatorId: Types.ObjectId,
    qrCode: string,
    ipAddress?: string,
    deviceInfo?: string,
    errorMessage?: string,
  ): Promise<void> {
    console.error('QR Validation Failed:', {
      validatorId,
      qrCode: qrCode.substring(0, 20) + '...',
      ipAddress,
      deviceInfo,
      errorMessage,
      timestamp: new Date(),
    });
  }

  private createValidationResponse(
    status: EntryStatus,
    message: string,
  ): ValidationResponseDto {
    return {
      status,
      message,
      isValid: status === EntryStatus.ALLOWED,
      validatedAt: new Date(),
    };
  }

  private createTicketInfo(ticket: any, alreadyUsed: boolean): any {
    return {
      id: ticket._id.toString(),
      ticketNumber: ticket.ticketNumber,
      eventTitle: ticket.eventId.title,
      eventDate: ticket.eventId.startDate,
      attendeeName: `${ticket.attendeeInfo.firstName} ${ticket.attendeeInfo.lastName}`,
      ticketType: ticket.ticketTypeId.name,
      seatNumber: ticket.seatNumber,
      alreadyUsed,
    };
  }

  private getStatusMessage(status: EntryStatus): string {
    const messages = {
      [EntryStatus.ALLOWED]: 'Entrada permitida',
      [EntryStatus.ALREADY_USED]: 'Ticket ya utilizado',
      [EntryStatus.INVALID_TICKET]: 'Ticket inválido',
      [EntryStatus.INVALID_SIGNATURE]: 'Código QR inválido o manipulado',
      [EntryStatus.EVENT_NOT_STARTED]: 'El evento aún no ha iniciado',
      [EntryStatus.EVENT_ENDED]: 'El evento ya terminó',
    };
    return messages[status] || 'Estado desconocido';
  }

  private async getLastActivityTime(
    eventId: Types.ObjectId,
  ): Promise<Date | null> {
    const lastLog = await this.entryLogModel
      .findOne({ eventId })
      .sort({ validatedAt: -1 })
      .select('validatedAt')
      .lean();

    return lastLog?.validatedAt || null;
  }
}
