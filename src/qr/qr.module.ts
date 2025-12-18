import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QRController } from './qr.controller';
import { QRService } from './qr.service';
import { EntryLog, EntryLogSchema } from './entities/qr.entity';
import { Ticket, TicketSchema } from 'src/tickets/entities/ticket.entity';
import { Event, EventSchema } from 'src/events/entities/event.entity';
import { EventsModule } from 'src/events/events.module';
import {
  EventParticipant,
  EventParticipantSchema,
} from 'src/events/entities/event-participant.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntryLog.name, schema: EntryLogSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventParticipant.name, schema: EventParticipantSchema },
    ]),
    forwardRef(() => EventsModule),
  ],
  controllers: [QRController],
  providers: [QRService],
  exports: [QRService],
})
export class QRModule {}
