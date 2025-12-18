import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OrdersService } from '../orders/orders.service';
import { Ticket, TicketDocument } from './entities/ticket.entity';
import {
  TicketType,
  TicketTypeDocument,
} from '../events/entities/ticket.entity';
import { UsersService } from '../users/users.service';
import { ParticipantType } from '../common/enums/participant-type.enum';
import { TicketLifecycleStatus } from '../common/enums/ticket-lifecycle-status.enum';

@Injectable()
export class TicketsService {
  constructor(
    @InjectModel(Ticket.name) private ticketModel: Model<TicketDocument>,
    @InjectModel(TicketType.name)
    private ticketTypeModel: Model<TicketTypeDocument>,
    private ordersService: OrdersService,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
  ) {}

  async generateTicketsForOrder(orderId: string): Promise<Ticket[]> {
    const order = await this.ordersService.findOne(orderId);

    const tickets: Ticket[] = [];

    for (const item of order.items) {
      for (let i = 0; i < item.quantity; i++) {
        const ticketNumber = await this.generateTicketNumber();

        const ticket = new this.ticketModel({
          ticketNumber,
          orderId: order.id,
          userId: order.userId,
          eventId: order.event.id,
          ticketTypeId: item.ticketTypeId,
          ticketTypeName: item.ticketTypeName,
          price: item.unitPrice,
          currency: item.currency,
          status: 'active',
          attendeeInfo: order.customerInfo,
        });

        tickets.push(await ticket.save());
      }
    }

    return tickets;
  }

  async getUserTickets(userId: string): Promise<Ticket[]> {
    return this.ticketModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate('eventId', 'title startDate endDate location')
      .populate('orderId', 'orderNumber total')
      .sort({ createdAt: -1 })
      .exec();
  }

  async getEventTickets(eventId: string): Promise<Ticket[]> {
    return this.ticketModel
      .find({ eventId: new Types.ObjectId(eventId) })
      .populate('userId', 'email')
      .populate('orderId', 'orderNumber')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(ticketId: string): Promise<TicketDocument> {
    const ticket = await this.ticketModel
      .findById(ticketId)
      .populate('eventId', 'title startDate endDate location')
      .populate('orderId', 'orderNumber customerInfo')
      .exec();

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  async updateAttendeeInfo(
    ticketId: string,
    attendeeInfo: any,
  ): Promise<Ticket> {
    const ticket = await this.findOne(ticketId);

    if (ticket.status !== 'active') {
      throw new BadRequestException('Cannot update inactive ticket');
    }

    ticket.attendeeInfo = attendeeInfo;
    return await ticket.save();
  }

  async transferTicket(ticketId: string, newUserId: string): Promise<Ticket> {
    const ticket = await this.findOne(ticketId);

    if (ticket.status !== 'active') {
      throw new BadRequestException('Cannot transfer inactive ticket');
    }

    ticket.transferredTo = new Types.ObjectId(newUserId);
    ticket.transferredAt = new Date();

    return await ticket.save();
  }

  async cancelTicketsForOrder(orderId: string): Promise<void> {
    await this.ticketModel.updateMany(
      { orderId: new Types.ObjectId(orderId) },
      {
        status: 'cancelled',
        updatedAt: new Date(),
      },
    );
  }

  async generateTicketForInvitation(data: {
    userId: string;
    eventId: string;
    ticketTypeId: string;
    participantId: string;
    participantType: ParticipantType;
  }): Promise<Ticket> {
    // Obtener información del usuario
    const user = await this.usersService.findOne(data.userId);

    if (!user.person) {
      throw new BadRequestException('User does not have person information');
    }

    // Obtener información del ticket type
    const ticketType = await this.ticketTypeModel
      .findById(new Types.ObjectId(data.ticketTypeId))
      .exec();

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    // Generar número de ticket único
    const ticketNumber = await this.generateTicketNumber();

    // Crear ticket
    const ticket = new this.ticketModel({
      ticketNumber,
      orderId: null, // No tiene orden porque no pagó
      userId: new Types.ObjectId(data.userId),
      eventId: new Types.ObjectId(data.eventId),
      ticketTypeId: new Types.ObjectId(data.ticketTypeId),
      ticketTypeName: ticketType.name,
      price: 0, // Gratis (invitación o beca)
      currency: ticketType.currency,
      status: TicketLifecycleStatus.ACTIVE,
      sourceType: 'invitation',
      sourceId: new Types.ObjectId(data.participantId),
      participantType: data.participantType,
      attendeeInfo: {
        firstName: user.person.firstName,
        lastName: user.person.lastName,
        email: user.email,
        phone: user.person.phone || '',
        documentType: (user.person as any).documentType || 'DNI',
        documentNumber: (user.person as any).documentNumber || '00000000',
      },
    });

    return await ticket.save();
  }

  async cancelTicketForParticipant(participantId: string): Promise<void> {
    await this.ticketModel.updateMany(
      {
        sourceType: 'invitation',
        sourceId: new Types.ObjectId(participantId),
      },
      {
        status: TicketLifecycleStatus.CANCELLED,
        updatedAt: new Date(),
      },
    );
  }

  private async generateTicketNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const lastTicket = await this.ticketModel
      .findOne({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })
      .sort({ createdAt: -1 })
      .exec();

    let sequence = 1;
    if (lastTicket) {
      const lastSequence = parseInt(lastTicket.ticketNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `TKT-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }
}
