import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketType, TicketTypeSchema } from './entities/ticket.entity';
import { EventSchema } from './entities/event.entity';
import { CompaniesModule } from 'src/companies/companies.module';
import { SpeakersModule } from 'src/speakers/speakers.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: TicketType.name, schema: TicketTypeSchema },
    ]),
    forwardRef(() => CompaniesModule),
    forwardRef(() => SpeakersModule),
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService, MongooseModule],
})
export class EventsModule {}
