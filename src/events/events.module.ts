import { forwardRef, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Event, EventSchema } from './entities/event.entity';
import {
  TicketType,
  TicketTypeSchema,
} from 'src/event-ticket-types/entities/ticket.entity';
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
import { TicketsModule } from 'src/tickets/tickets.module';
import { EventSponsorsModule } from '../event-sponsors/event-sponsors.module';
import { EventParticipantsService } from './event-participants.service';
import { SponsorInvitationsService } from './sponsor-invitations.service';
import { EventParticipantsController } from './event-participants.controller';
import {
  EventInvitationsController,
  SponsorInvitationsController,
  PublicInvitationsController,
} from './sponsor-invitations.controller';
import { EventTicketTypesModule } from 'src/event-ticket-types/event-ticket-types.module';
import { OperationalStaffInvitationsController } from './operational-staff-invitations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Event.name, schema: EventSchema },
      { name: TicketType.name, schema: TicketTypeSchema },
      { name: EventParticipant.name, schema: EventParticipantSchema },
      { name: SponsorInvitation.name, schema: SponsorInvitationSchema },
    ]),
    forwardRef(() => CompaniesModule),
    forwardRef(() => SpeakersModule),
    forwardRef(() => UsersModule),
    forwardRef(() => TicketsModule),
    forwardRef(() => EventSponsorsModule),
    EventTicketTypesModule,
  ],
  controllers: [
    EventsController,
    EventParticipantsController,
    EventInvitationsController,
    SponsorInvitationsController,
    PublicInvitationsController,
    OperationalStaffInvitationsController,
  ],
  providers: [
    EventsService,
    EventParticipantsService,
    SponsorInvitationsService,
  ],
  exports: [
    EventsService,
    EventParticipantsService,
    SponsorInvitationsService,
    MongooseModule,
  ],
})
export class EventsModule {}
