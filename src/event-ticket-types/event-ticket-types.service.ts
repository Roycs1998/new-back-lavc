import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Event, EventDocument } from '../events/entities/event.entity';
import {
  TicketType,
  TicketTypeDocument,
} from './entities/ticket.entity';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { TicketTypeDto } from './dto/ticket-type.dto';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { ParticipantType } from 'src/common/enums/participant-type.enum';
import { Currency } from 'src/common/enums/currency.enum';
import { toObjectId } from 'src/utils/toObjectId';
import { toDto } from 'src/utils/toDto';
import { sanitizeDefined } from 'src/utils/sanitizeDefined';

@Injectable()
export class EventTicketTypesService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(TicketType.name)
    private readonly ticketTypeModel: Model<TicketTypeDocument>,
  ) {}

  async createDefaultSystemTickets(
    eventId: string,
    createdBy: string,
  ): Promise<void> {
    const systemTickets: Array<{
      name: string;
      description: string;
      price: number;
      quantity: number;
      targetRole: string;
    }> = [
      {
        name: 'Acceso de Staff',
        description: 'Acceso para Staff Operativo',
        price: 0,
        quantity: 9999,
        targetRole: ParticipantType.OPERATIONAL_STAFF,
      },
      {
        name: 'Accesso de Expositores',
        description: 'Acceso para Expositores (Staff)',
        price: 0,
        quantity: 9999,
        targetRole: ParticipantType.STAFF,
      },
      {
        name: 'Acceso de Invitados',
        description: 'Acceso para Invitados',
        price: 0,
        quantity: 9999,
        targetRole: ParticipantType.GUEST,
      },
    ];

    await this.ticketTypeModel.insertMany(
      systemTickets.map((ticket) => ({
        eventId: new Types.ObjectId(eventId),
        name: ticket.name,
        description: ticket.description,
        price: ticket.price,
        quantity: ticket.quantity,
        currency: Currency.PEN,
        ticketStatus: TicketStatus.AVAILABLE,
        isSystem: true,
        targetRole: ticket.targetRole,
        createdBy: new Types.ObjectId(createdBy),
      })),
    );
  }

  async createTicketType(
    eventId: string,
    createTicketTypeDto: CreateTicketTypeDto,
    createdBy: string,
  ): Promise<TicketTypeDto> {
    const event = await this.eventModel
      .findOne({
        _id: toObjectId(eventId),
        eventStatus: { $ne: EventStatus.DELETED },
      })
      .lean()
      .exec();

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    const ticketTypeData = {
      ...createTicketTypeDto,
      eventId: new Types.ObjectId(eventId),
      createdBy: new Types.ObjectId(createdBy),
      ticketStatus: createTicketTypeDto.ticketStatus ?? TicketStatus.AVAILABLE,
    };

    const created = await this.ticketTypeModel.create(ticketTypeData);

    return toDto(created, TicketTypeDto);
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

    if (!updated) {
      throw new NotFoundException(
        `Ticket con ID ${ticketTypeId} no encontrado`,
      );
    }

    return toDto(updated, TicketTypeDto);
  }

  async getEventTicketTypes(eventId: string): Promise<TicketTypeDto[]> {
    const docs = await this.ticketTypeModel
      .find({
        eventId: new Types.ObjectId(eventId),
        price: { $gt: 0 },
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

