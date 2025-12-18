import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EventParticipant,
  EventParticipantDocument,
} from '../../events/entities/event-participant.entity';
import { Event, EventDocument } from '../../events/entities/event.entity';
import { ParticipantType } from '../enums/participant-type.enum';

@Injectable()
export class OperationalStaffGuard implements CanActivate {
  constructor(
    @InjectModel(EventParticipant.name)
    private eventParticipantModel: Model<EventParticipantDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const eventId = request.params.eventId || request.body.eventId;

    if (!eventId) {
      throw new ForbiddenException('Event ID is required');
    }

    // Verificar evento
    const event = await this.eventModel.findById(eventId).lean();

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    // Verificar que no ha terminado (usa event.endDate)
    const now = new Date();
    if (event.endDate && now > event.endDate) {
      throw new ForbiddenException('El acceso del staff ha finalizado');
    }

    // Verificar asignación
    const staffAssignment = await this.eventParticipantModel
      .findOne({
        userId: new Types.ObjectId(user.userId),
        eventId: new Types.ObjectId(eventId),
        participantType: ParticipantType.OPERATIONAL_STAFF,
        isActive: true,
      })
      .lean();

    if (!staffAssignment) {
      throw new ForbiddenException('No tienes acceso como staff operativo');
    }

    request.staffAssignment = staffAssignment;
    request.event = event;
    return true;
  }
}
