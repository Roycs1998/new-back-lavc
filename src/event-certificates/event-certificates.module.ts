import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventCertificatesController } from './event-certificates.controller';
import { EventCertificatesService } from './event-certificates.service';
import {
  CertificateTemplate,
  CertificateTemplateSchema,
} from './entities/certificate-template.entity';
import { StorageModule } from 'src/storage/storage.module';
import { EventsModule } from 'src/events/events.module';
import { EventTicketTypesModule } from '../event-ticket-types/event-ticket-types.module';

import { TicketsModule } from 'src/tickets/tickets.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CertificateTemplate.name, schema: CertificateTemplateSchema },
    ]),
    StorageModule,
    forwardRef(() => EventsModule), // Para validar tickets y participantes
    forwardRef(() => TicketsModule),
    EventTicketTypesModule,
  ],
  controllers: [EventCertificatesController],
  providers: [EventCertificatesService],
  exports: [EventCertificatesService],
})
export class EventCertificatesModule {}
