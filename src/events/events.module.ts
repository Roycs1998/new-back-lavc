import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './entities/event.entity';
import { TicketType, TicketTypeSchema } from './entities/ticket.entity';
import {
  EventSponsor,
  EventSponsorSchema,
} from './entities/event-sponsor.entity';
import {
  EventParticipant,
  EventParticipantSchema,
} from './entities/event-participant.entity';
import {
  SponsorInvitation,
  SponsorInvitationSchema,
} from './entities/sponsor-invitation.entity';
import { CompaniesModule } from 'src/companies/companies.module';
import { SpeakersModule } from 'src/speakers/speakers.module';
import { UsersModule } from 'src/users/users.module';
import { PersonsModule } from 'src/persons/persons.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { EventSponsorsService } from './event-sponsors.service';
import { EventParticipantsService } from './event-participants.service';
import { SponsorInvitationsService } from './sponsor-invitations.service';
import { EventSponsorsController } from './event-sponsors.controller';
import { EventParticipantsController } from './event-participants.controller';
import {
  EventInvitationsController,
  SponsorInvitationsController,
  PublicInvitationsController,
} from './sponsor-invitations.controller';
import { EventCleanupService } from './event-cleanup.service';
import { OperationalStaffInvitationsController } from './operational-staff-invitations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: TicketType.name, schema: TicketTypeSchema },
      { name: EventSponsor.name, schema: EventSponsorSchema },
      { name: EventParticipant.name, schema: EventParticipantSchema },
      { name: SponsorInvitation.name, schema: SponsorInvitationSchema },
    ]),
    forwardRef(() => CompaniesModule),
    forwardRef(() => SpeakersModule),
    forwardRef(() => UsersModule),
    forwardRef(() => PersonsModule),
    forwardRef(() => TicketsModule),
  ],
  controllers: [
    EventsController,
    EventSponsorsController,
    EventParticipantsController,
    EventInvitationsController,
    SponsorInvitationsController,
    PublicInvitationsController,
    OperationalStaffInvitationsController,
  ],
  providers: [
    EventsService,
    EventSponsorsService,
    EventParticipantsService,
    SponsorInvitationsService,
    EventCleanupService,
  ],
  exports: [
    EventsService,
    EventSponsorsService,
    EventParticipantsService,
    SponsorInvitationsService,
    MongooseModule,
  ],
})
export class EventsModule {}
