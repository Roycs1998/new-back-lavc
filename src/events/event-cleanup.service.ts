import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  EventParticipant,
  EventParticipantDocument,
} from './entities/event-participant.entity';
import { Event, EventDocument } from './entities/event.entity';
import { ParticipantType } from '../common/enums/participant-type.enum';

@Injectable()
export class EventCleanupService {
  constructor(
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(EventParticipant.name)
    private eventParticipantModel: Model<EventParticipantDocument>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredStaffAccess() {
    const now = new Date();

    console.log('[EventCleanup] Iniciando limpieza de staff operativo...');

    // Buscar eventos que ya terminaron
    const expiredEvents = await this.eventModel
      .find({ endDate: { $lt: now } })
      .select('_id title endDate')
      .lean();

    if (expiredEvents.length === 0) {
      console.log('[EventCleanup] No hay eventos finalizados');
      return;
    }

    // Desactivar staff operativo de esos eventos
    for (const event of expiredEvents) {
      const result = await this.eventParticipantModel.updateMany(
        {
          eventId: event._id,
          participantType: ParticipantType.OPERATIONAL_STAFF,
          isActive: true,
        },
        {
          $set: {
            isActive: false,
            cancelledAt: now,
          },
        },
      );

      console.log(
        `[EventCleanup] Evento: ${event.title} - Desactivados: ${result.modifiedCount} staff`,
      );
    }

    console.log('[EventCleanup] Limpieza completada');
  }

  // Método manual para forzar limpieza de un evento específico
  async forceCleanupEvent(eventId: string) {
    const result = await this.eventParticipantModel.updateMany(
      {
        eventId: eventId,
        participantType: ParticipantType.OPERATIONAL_STAFF,
        isActive: true,
      },
      {
        $set: {
          isActive: false,
          cancelledAt: new Date(),
        },
      },
    );

    return {
      success: true,
      deactivatedCount: result.modifiedCount,
    };
  }
}
