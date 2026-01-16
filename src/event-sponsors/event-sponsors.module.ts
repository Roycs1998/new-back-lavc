import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventSponsorsService } from './event-sponsors.service';
import {
  EventSponsorsController,
  CompanySponsorEventsController,
} from './event-sponsors.controller';
import {
  EventSponsor,
  EventSponsorSchema,
} from './entities/event-sponsor.entity';
import {
  SponsorQuotaRequest,
  SponsorQuotaRequestSchema,
} from './entities/sponsor-quota-request.entity';
import {
  SponsorStandVisit,
  SponsorStandVisitSchema,
} from './entities/sponsor-stand-visit.entity';
import { EventsModule } from '../events/events.module';
import { CompaniesModule } from '../companies/companies.module';
import { UsersModule } from '../users/users.module';
import { Event, EventSchema } from '../events/entities/event.entity';
import {
  EventParticipant,
  EventParticipantSchema,
} from '../events/entities/event-participant.entity';
import { Ticket, TicketSchema } from '../tickets/entities/ticket.entity';
import { QRModule } from '../qr/qr.module';
import { SponsorStandsService } from './sponsor-stands.service';
import { SponsorStandsController } from './sponsor-stands.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EventSponsor.name, schema: EventSponsorSchema },
      { name: SponsorQuotaRequest.name, schema: SponsorQuotaRequestSchema },
      { name: Event.name, schema: EventSchema },
      { name: SponsorStandVisit.name, schema: SponsorStandVisitSchema },
      { name: EventParticipant.name, schema: EventParticipantSchema },
      { name: Ticket.name, schema: TicketSchema },
    ]),
    forwardRef(() => EventsModule),
    forwardRef(() => CompaniesModule),
    forwardRef(() => UsersModule),
    QRModule,
  ],
  controllers: [
    EventSponsorsController,
    CompanySponsorEventsController,
    SponsorStandsController,
  ],
  providers: [EventSponsorsService, SponsorStandsService],
  exports: [EventSponsorsService, SponsorStandsService, MongooseModule],
})
export class EventSponsorsModule {}
