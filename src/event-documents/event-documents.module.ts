import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EventDocumentsController } from './event-documents.controller';
import { EventDocumentsService } from './event-documents.service';
import {
  EventDocumentRequirement,
  EventDocumentRequirementSchema,
} from './entities/event-document-requirement.entity';
import {
  SponsorDocumentSubmission,
  SponsorDocumentSubmissionSchema,
} from './entities/sponsor-document-submission.entity';
import { EventsModule } from 'src/events/events.module';
import { CompaniesModule } from 'src/companies/companies.module';
import { StorageModule } from 'src/storage/storage.module';
import { EventSponsorsModule } from 'src/event-sponsors/event-sponsors.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: EventDocumentRequirement.name,
        schema: EventDocumentRequirementSchema,
      },
      {
        name: SponsorDocumentSubmission.name,
        schema: SponsorDocumentSubmissionSchema,
      },
    ]),
    forwardRef(() => EventsModule),
    forwardRef(() => CompaniesModule),
    EventSponsorsModule,
    StorageModule,
  ],
  controllers: [EventDocumentsController],
  providers: [EventDocumentsService],
  exports: [EventDocumentsService, MongooseModule],
})
export class EventDocumentsModule {}
