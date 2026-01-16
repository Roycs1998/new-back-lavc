import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventTicketTypesService } from './event-ticket-types.service';
import { EventTicketTypesController } from './event-ticket-types.controller';
import { TicketType, TicketTypeSchema } from './entities/ticket.entity';
import { Event, EventSchema } from '../events/entities/event.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TicketType.name, schema: TicketTypeSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [EventTicketTypesController],
  providers: [EventTicketTypesService],
  exports: [EventTicketTypesService, MongooseModule],
})
export class EventTicketTypesModule {}
