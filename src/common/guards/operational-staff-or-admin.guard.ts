import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  EventParticipant,
  EventParticipantDocument,
} from '../../events/entities/event-participant.entity';
import { Event, EventDocument } from '../../events/entities/event.entity';
import { ParticipantType } from '../enums/participant-type.enum';
import { UserRole } from '../enums/user-role.enum';

@Injectable()
export class OperationalStaffOrAdminGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectModel(EventParticipant.name)
    private eventParticipantModel: Model<EventParticipantDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // 1. Verificar si es admin
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    const hasAdminRole = requiredRoles?.some((role) =>
      user.roles?.includes(role),
    );

    if (hasAdminRole) {
      return true;
    }

    // 2. Verificar si es staff operativo
    const eventId = this.extractEventId(request);

    if (!eventId) {
      throw new ForbiddenException('Event ID is required');
    }

    const event = await this.eventModel.findById(eventId).lean();

    if (!event) {
      throw new NotFoundException('Evento no encontrado');
    }

    const now = new Date();
    if (event.endDate && now > event.endDate) {
      throw new ForbiddenException('El acceso del staff ha finalizado');
    }

    const staffAssignment = await this.eventParticipantModel
      .findOne({
        userId: new Types.ObjectId(user.userId),
        eventId: new Types.ObjectId(eventId),
        participantType: ParticipantType.OPERATIONAL_STAFF,
        isActive: true,
      })
      .lean();

    if (!staffAssignment) {
      throw new ForbiddenException('No tienes acceso como staff a este evento');
    }

    request.staffAssignment = staffAssignment;
    request.event = event;
    return true;
  }

  private extractEventId(request: any): string | null {
    return (
      request.params.eventId ||
      request.body.eventId ||
      request.query.eventId ||
      null
    );
  }
}
