import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
  ApiConsumes,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';
import { EventDocumentsService } from './event-documents.service';
import { CreateEventDocumentRequirementDto } from './dto/create-event-document-requirement.dto';
import { UpdateEventDocumentRequirementDto } from './dto/update-event-document-requirement.dto';
import { EventDocumentRequirementDto } from './dto/event-document-requirement.dto';
import { SponsorDocumentsSummaryQueryDto } from './dto/sponsor-documents-summary-query.dto';
import { SponsorDocumentsPaginatedDto } from './dto/sponsor-documents-summary-pagination.dto';
import { SponsorDocumentSubmissionDto } from './dto/sponsor-document-submission.dto';
import { ReviewSponsorDocumentDto } from './dto/review-sponsor-document.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';

@ApiTags('Documentos de Eventos')
@Controller('events/:eventId/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EventDocumentsController {
  constructor(private readonly eventDocumentsService: EventDocumentsService) {}

  @Post('requirements')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Crear requisito de documento para el evento' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiCreatedResponse({
    description: 'Requisito creado correctamente',
    type: EventDocumentRequirementDto,
  })
  createRequirement(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() createDto: CreateEventDocumentRequirementDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventDocumentsService.createRequirement(
      eventId,
      createDto,
      currentUser,
    );
  }

  @Get('requirements')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Listar requisitos de documentos del evento' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiOkResponse({
    description: 'Lista de requisitos',
    type: [EventDocumentRequirementDto],
  })
  listRequirements(@Param('eventId', ParseObjectIdPipe) eventId: string) {
    return this.eventDocumentsService.listRequirements(eventId);
  }

  @Patch('requirements/:requirementId')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Actualizar requisito de documento' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiParam({ name: 'requirementId', description: 'ID del requisito' })
  @ApiOkResponse({
    description: 'Requisito actualizado',
    type: EventDocumentRequirementDto,
  })
  updateRequirement(
    @Param('requirementId', ParseObjectIdPipe) requirementId: string,
    @Body() updateDto: UpdateEventDocumentRequirementDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventDocumentsService.updateRequirement(
      requirementId,
      updateDto,
      currentUser,
    );
  }

  @Delete('requirements/:requirementId')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Eliminar (desactivar) requisito de documento' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiParam({ name: 'requirementId', description: 'ID del requisito' })
  @ApiOkResponse({ description: 'Requisito eliminado correctamente' })
  deleteRequirement(
    @Param('requirementId', ParseObjectIdPipe) requirementId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventDocumentsService.deleteRequirement(
      requirementId,
      currentUser,
    );
  }

  @Get('summary')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Obtener resumen de documentos de sponsors' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiOkResponse({
    description: 'Resumen paginado de documentos',
    type: SponsorDocumentsPaginatedDto,
  })
  getSummary(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Query() query: SponsorDocumentsSummaryQueryDto,
  ) {
    return this.eventDocumentsService.getSponsorDocumentsSummary(
      eventId,
      query,
    );
  }

  @Post('requirements/:requirementId/submit')
  @Roles(UserRole.COMPANY_ADMIN, UserRole.USER) // Staff de empresa
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir documento para un requisito' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiParam({ name: 'requirementId', description: 'ID del requisito' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Archivo del documento (PDF, JPG, PNG, max 10MB)',
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Documento subido correctamente',
    type: SponsorDocumentSubmissionDto,
  })
  submitDocument(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Param('requirementId', ParseObjectIdPipe) requirementId: string,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /(pdf|jpeg|png)$/,
        })
        .addMaxSizeValidator({
          maxSize: 10 * 1024 * 1024, // 10MB
        })
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        }),
    )
    file: Express.Multer.File,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventDocumentsService.submitDocument(
      eventId,
      requirementId,
      file.buffer,
      file.originalname,
      file.mimetype,
      file.size,
      currentUser,
    );
  }

  @Post('submissions/:submissionId/review')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Revisar (aprobar/rechazar) un documento' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiParam({ name: 'submissionId', description: 'ID del envío' })
  @ApiOkResponse({
    description: 'Documento revisado correctamente',
    type: SponsorDocumentSubmissionDto,
  })
  reviewDocument(
    @Param('submissionId', ParseObjectIdPipe) submissionId: string,
    @Body() reviewDto: ReviewSponsorDocumentDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventDocumentsService.reviewDocument(
      submissionId,
      reviewDto,
      currentUser,
    );
  }
}
