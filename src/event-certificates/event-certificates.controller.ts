import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { EventCertificatesService } from './event-certificates.service';
import { CreateCertificateTemplateDto } from './dto/create-certificate-template.dto';
import { UpdateCertificateTemplateDto } from './dto/update-certificate-template.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import type { Response } from 'express';
import { CertificateTemplateDto } from './dto/certificate-template.dto';

@ApiTags('Event Certificates')
@Controller('event-certificates')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EventCertificatesController {
  constructor(
    private readonly eventCertificatesService: EventCertificatesService,
  ) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Crear plantilla de certificado' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ type: CertificateTemplateDto })
  async create(
    @Body() createDto: CreateCertificateTemplateDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo PDF es requerido');
    }
    return this.eventCertificatesService.create(createDto, file);
  }

  @Get('event/:eventId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Listar plantillas de un evento' })
  @ApiResponse({ type: [CertificateTemplateDto] })
  findAllByEvent(@Param('eventId') eventId: string) {
    return this.eventCertificatesService.findAllByEvent(eventId);
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Obtener plantilla por ID' })
  @ApiResponse({ type: CertificateTemplateDto })
  findOne(@Param('id') id: string) {
    return this.eventCertificatesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Actualizar plantilla' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ type: CertificateTemplateDto })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCertificateTemplateDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.eventCertificatesService.update(id, updateDto, file);
  }

  @Delete(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Eliminar plantilla (soft delete)' })
  remove(@Param('id') id: string) {
    return this.eventCertificatesService.remove(id);
  }

  @Get(':id/preview')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Previsualizar certificado con datos de prueba' })
  async preview(@Param('id') id: string, @Res() res: Response) {
    const pdfBuffer =
      await this.eventCertificatesService.previewCertificate(id);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline; filename=certificate-preview.pdf',
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }

  @Get('download/:eventId')
  @Roles(UserRole.USER, UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN) // Users can download their own
  @ApiOperation({ summary: 'Descargar mi certificado del evento' })
  async downloadMyCertificate(
    @Param('eventId') eventId: string,
    @CurrentUser() user: CurrentUserData,
    @Res() res: Response,
  ) {
    const pdfBuffer =
      await this.eventCertificatesService.generateCertificateForUser(
        eventId,
        user.id,
      );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=certificate-${eventId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  }
}
