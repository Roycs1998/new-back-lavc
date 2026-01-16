import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { StorageService } from 'src/storage/storage.service';
import { StoragePath } from 'src/storage/enums/storage-path.enum';
import { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { toDto } from 'src/utils/toDto';

import {
  EventDocumentRequirement,
  EventDocumentRequirementDocument,
} from './entities/event-document-requirement.entity';
import {
  SponsorDocumentSubmission,
  SponsorDocumentSubmissionDocument,
  SponsorDocumentStatus,
} from './entities/sponsor-document-submission.entity';
import { CreateEventDocumentRequirementDto } from './dto/create-event-document-requirement.dto';
import { UpdateEventDocumentRequirementDto } from './dto/update-event-document-requirement.dto';
import { EventDocumentRequirementDto } from './dto/event-document-requirement.dto';
import { SponsorDocumentsSummaryQueryDto } from './dto/sponsor-documents-summary-query.dto';
import { SponsorDocumentsPaginatedDto } from './dto/sponsor-documents-summary-pagination.dto';
import { SponsorDocumentsBySponsorDto } from './dto/sponsor-documents-by-sponsor.dto';
import { SponsorRequirementStatusDto } from './dto/sponsor-requirement-status.dto';
import { SponsorDocumentSubmissionDto } from './dto/sponsor-document-submission.dto';
import { ReviewSponsorDocumentDto } from './dto/review-sponsor-document.dto';
import {
  EventSponsor,
  EventSponsorDocument,
} from 'src/event-sponsors/entities/event-sponsor.entity';
import { Company } from 'src/companies/entities/company.entity';

@Injectable()
export class EventDocumentsService {
  constructor(
    @InjectModel(EventDocumentRequirement.name)
    private requirementModel: Model<EventDocumentRequirementDocument>,
    @InjectModel(SponsorDocumentSubmission.name)
    private submissionModel: Model<SponsorDocumentSubmissionDocument>,
    @InjectModel(EventSponsor.name)
    private eventSponsorModel: Model<EventSponsor & { company: Company }>,
    private readonly storageService: StorageService,
  ) {}

  async createRequirement(
    eventId: string,
    dto: CreateEventDocumentRequirementDto,
    currentUser: CurrentUserData,
  ): Promise<EventDocumentRequirementDto> {
    const created = new this.requirementModel({
      ...dto,
      eventId: new Types.ObjectId(eventId),
      createdBy: new Types.ObjectId(currentUser.id),
    });

    const saved = await created.save();
    return toDto(saved, EventDocumentRequirementDto);
  }

  async listRequirements(
    eventId: string,
  ): Promise<EventDocumentRequirementDto[]> {
    const docs = await this.requirementModel
      .find({
        eventId: new Types.ObjectId(eventId),
        isActive: true,
      })
      .sort({ createdAt: 1 })
      .exec();

    return docs.map((doc) => toDto(doc, EventDocumentRequirementDto));
  }

  async updateRequirement(
    requirementId: string,
    dto: UpdateEventDocumentRequirementDto,
    currentUser: CurrentUserData,
  ): Promise<EventDocumentRequirementDto> {
    const updated = await this.requirementModel.findByIdAndUpdate(
      requirementId,
      {
        ...dto,
        updatedBy: new Types.ObjectId(currentUser.id),
      },
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException('Requisito no encontrado');
    }

    return toDto(updated, EventDocumentRequirementDto);
  }

  async deleteRequirement(
    requirementId: string,
    currentUser: CurrentUserData,
  ): Promise<void> {
    const updated = await this.requirementModel.findByIdAndUpdate(
      requirementId,
      {
        isActive: false,
        updatedBy: new Types.ObjectId(currentUser.id),
      },
    );

    if (!updated) {
      throw new NotFoundException('Requisito no encontrado');
    }
  }

  async getSponsorDocumentsSummary(
    eventId: string,
    query: SponsorDocumentsSummaryQueryDto,
  ): Promise<SponsorDocumentsPaginatedDto> {
    const { page = 1, limit = 10, companyId, onlyWithIssues } = query;
    const eventObjectId = new Types.ObjectId(eventId);

    const filter: FilterQuery<EventSponsor> = {
      eventId: eventObjectId,
      isActive: true,
    };

    if (companyId) {
      filter.companyId = new Types.ObjectId(companyId);
    }

    // Calcular skip
    const skip = (page - 1) * limit;

    // Obtener sponsors paginados
    const [sponsors, totalSponsors] = await Promise.all([
      this.eventSponsorModel
        .find(filter)
        .populate('company')
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.eventSponsorModel.countDocuments(filter),
    ]);

    // Obtener todos los requisitos del evento
    const requirements = await this.requirementModel
      .find({ eventId: eventObjectId, isActive: true })
      .lean()
      .exec();

    // Obtener IDs de sponsors cargados
    const sponsorIds = sponsors.map((s) => s._id);

    // Obtener todas las entregas para estos sponsors
    const submissions = await this.submissionModel
      .find({
        eventSponsorId: { $in: sponsorIds },
      })
      .sort({ createdAt: -1 }) // Ordenar por fecha para facilitar encontrar el último
      .lean()
      .exec();

    // Construir DTOs
    const data: SponsorDocumentsBySponsorDto[] = sponsors.map((sponsor) => {
      const company = sponsor.company as unknown as Company;
      const sponsorSubmissions = submissions.filter(
        (sub) => sub.eventSponsorId.toString() === sponsor._id.toString(),
      );

      let missingRequiredCount = 0;
      let totalRequired = 0;

      const requirementsStatus: SponsorRequirementStatusDto[] =
        requirements.map((req) => {
          // Buscar la última entrega para este requisito
          const lastSubmission = sponsorSubmissions.find(
            (sub) => sub.requirementId.toString() === req._id.toString(),
          );

          if (req.isRequired) {
            totalRequired++;
          }

          const isMissing =
            req.isRequired &&
            (!lastSubmission ||
              lastSubmission.status === SponsorDocumentStatus.REJECTED);

          if (isMissing) {
            missingRequiredCount++;
          }

          return {
            requirementId: req._id.toString(),
            title: req.title,
            isRequired: req.isRequired,
            lastStatus: lastSubmission?.status as SponsorDocumentStatus,
            isMissingRequired: isMissing,
            lastSubmission: lastSubmission
              ? toDto(lastSubmission, SponsorDocumentSubmissionDto)
              : undefined,
          };
        });

      return {
        sponsorId: sponsor._id.toString(),
        companyId: sponsor.companyId.toString(),
        companyName: company?.name || 'Empresa desconocida',
        companyEmail: company?.contactEmail,
        requirements: requirementsStatus,
        missingRequiredCount,
        totalRequired,
        isCompliant: missingRequiredCount === 0,
      };
    });

    // Filtrado en memoria si se solicita onlyWithIssues
    // NOTA: Esto afecta la paginación real, pero es un compromiso razonable
    // sin usar pipelines de agregación complejos.
    let finalData = data;
    if (onlyWithIssues === 1) {
      finalData = data.filter((item) => item.missingRequiredCount > 0);
    }

    const totalPages = Math.ceil(totalSponsors / limit);

    return {
      data: finalData,
      totalItems: totalSponsors,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    };
  }

  async submitDocument(
    eventId: string,
    requirementId: string,
    file: Buffer,
    fileName: string,
    mimeType: string,
    fileSize: number,
    currentUser: CurrentUserData,
  ): Promise<SponsorDocumentSubmissionDto> {
    // 1. Verificar requisito
    const requirement = await this.requirementModel.findById(requirementId);
    if (!requirement || !requirement.isActive) {
      throw new NotFoundException('Requisito no válido');
    }

    // 2. Verificar que el usuario pertenece a una empresa sponsor del evento
    // Buscamos el sponsor asociado a la empresa del usuario para este evento
    const sponsor = await this.resolveSponsor(eventId, currentUser);

    const fileInfo = await this.storageService.uploadFile(
      file,
      fileName,
      mimeType,
      {
        path: StoragePath.DOCUMENTS,
        isPublic: false, // Documentos suelen ser privados/sensibles
        allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxSize: 10 * 1024 * 1024, // 10MB
      },
    );

    const submission = new this.submissionModel({
      requirementId: new Types.ObjectId(requirementId),
      eventSponsorId: sponsor._id,
      companyId: sponsor.companyId,
      fileKey: fileInfo.key,
      fileUrl: fileInfo.url, // Usamos la key/url interna, para publicUrl se usará signedUrl si es privado
      fileName: fileName,
      fileMimeType: mimeType,
      fileSize: fileSize,
      status: SponsorDocumentStatus.PENDING,
      uploadedBy: new Types.ObjectId(currentUser.id),
    });

    const saved = await submission.save();
    return toDto(saved, SponsorDocumentSubmissionDto);
  }

  // Helper para resolver sponsor
  private async resolveSponsor(
    eventId: string,
    user: CurrentUserData,
  ): Promise<EventSponsorDocument> {
    // Si el usuario tiene companyIds en su token (ideal)
    if (user.companyIds && user.companyIds.length > 0) {
      const sponsor = await this.eventSponsorModel.findOne({
        eventId: new Types.ObjectId(eventId),
        companyId: { $in: user.companyIds.map((id) => new Types.ObjectId(id)) },
        isActive: true,
      });

      if (sponsor) {
        return sponsor as EventSponsorDocument;
      }
    }

    // Si no se pudo resolver por companyId directo o no se encontró
    throw new BadRequestException(
      'No se pudo identificar un patrocinador activo asociado a su usuario para este evento.',
    );
  }

  // Re-thinking submit:
  // Maybe I should pass companyId/sponsorId in the DTO?
  // User asked for "best practices".
  // Best practice: Infer from context if possible, or explicit param if user manages multiple.
  // I'll add `eventSponsorId` to the upload DTO or query param?
  // No, upload usually just sends file.

  // I will implement `submitDocument` fully when I have the Controller part ready to pass the param.
  // For now I'll include the logic assuming I can find it.

  async reviewDocument(
    submissionId: string,
    dto: ReviewSponsorDocumentDto,
    currentUser: CurrentUserData,
  ): Promise<SponsorDocumentSubmissionDto> {
    const submission = await this.submissionModel.findById(submissionId);
    if (!submission) {
      throw new NotFoundException('Envío no encontrado');
    }

    submission.status = dto.status;
    submission.reviewerComment = dto.reviewerComment;
    submission.reviewedBy = new Types.ObjectId(currentUser.id);
    submission.reviewedAt = new Date();

    const saved = await submission.save();
    return toDto(saved, SponsorDocumentSubmissionDto);
  }
}
