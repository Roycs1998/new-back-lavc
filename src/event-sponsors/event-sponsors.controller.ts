import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { EventSponsorsService } from './event-sponsors.service';
import { CreateEventSponsorDto } from './dto/create-event-sponsor.dto';
import { UpdateEventSponsorDto } from './dto/update-event-sponsor.dto';
import { EventSponsorDto } from './dto/event-sponsor.dto';
import { CreateQuotaRequestDto } from './dto/create-quota-request.dto';
import { ReviewQuotaRequestDto } from './dto/review-quota-request.dto';
import { QuotaRequestDto } from './dto/quota-request.dto';
import { QuotaRequestStatus } from './entities/sponsor-quota-request.entity';
import { EventsPaginatedDto } from '../events/dto/events-pagination.dto';
import { QuotaAvailabilityDto } from './dto/quota-availability.dto';
import { ParticipantType } from '../common/enums/participant-type.enum';
import { EventStatus } from '../common/enums/event-status.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Patrocinadores de Eventos')
@Controller('events/:eventId/sponsors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EventSponsorsController {
  constructor(private readonly eventSponsorsService: EventSponsorsService) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Agregar patrocinador a un evento',
    description:
      'Asigna una empresa como patrocinadora de un evento con cuotas específicas para staff, invitados y becas. Si el patrocinador ya existe pero está inactivo, lo reactiva con las nuevas cuotas.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiCreatedResponse({
    type: EventSponsorDto,
    description: 'Patrocinador agregado o reactivado exitosamente',
  })
  @ApiConflictResponse({
    description: 'La empresa ya es patrocinadora activa de este evento',
  })
  @ApiNotFoundResponse({ description: 'Evento no encontrado' })
  async addSponsor(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() createDto: CreateEventSponsorDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventSponsorsService.addSponsorToEvent(
      eventId,
      createDto,
      currentUser.id,
    );
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Listar patrocinadores de un evento',
    description: 'Obtiene todos los patrocinadores activos de un evento.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    type: [EventSponsorDto],
    description: 'Lista de patrocinadores obtenida exitosamente',
  })
  async listSponsors(@Param('eventId', ParseObjectIdPipe) eventId: string) {
    return await this.eventSponsorsService.getSponsorsByEvent(eventId);
  }

  @Get(':sponsorId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Obtener detalles de un patrocinador',
    description:
      'Obtiene información detallada de un patrocinador incluyendo cuotas y uso.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiParam({
    name: 'sponsorId',
    description: 'ID del patrocinador',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @ApiOkResponse({
    type: EventSponsorDto,
    description: 'Detalles del patrocinador obtenidos exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Patrocinador no encontrado' })
  async getSponsor(@Param('sponsorId', ParseObjectIdPipe) sponsorId: string) {
    return await this.eventSponsorsService.getSponsorDetails(sponsorId);
  }

  @Patch(':sponsorId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Actualizar cuotas de un patrocinador',
    description:
      'Actualiza las cuotas asignadas. No se puede reducir una cuota por debajo de la cantidad ya utilizada.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiParam({
    name: 'sponsorId',
    description: 'ID del patrocinador',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @ApiOkResponse({
    type: EventSponsorDto,
    description: 'Cuotas actualizadas exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'No se puede reducir la cuota por debajo de lo ya utilizado',
  })
  @ApiNotFoundResponse({ description: 'Patrocinador no encontrado' })
  async updateSponsor(
    @Param('sponsorId', ParseObjectIdPipe) sponsorId: string,
    @Body() updateDto: UpdateEventSponsorDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventSponsorsService.updateSponsorQuotas(
      sponsorId,
      updateDto,
      currentUser.id,
    );
  }

  @Delete(':sponsorId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar patrocinador de un evento',
    description:
      'Desactiva un patrocinador del evento. El patrocinador puede ser reactivado posteriormente agregándolo de nuevo.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiParam({
    name: 'sponsorId',
    description: 'ID del patrocinador',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @ApiOkResponse({
    type: EventSponsorDto,
    description: 'Patrocinador desactivado exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'El patrocinador ya está inactivo',
  })
  @ApiNotFoundResponse({ description: 'Patrocinador no encontrado' })
  async removeSponsor(
    @Param('sponsorId', ParseObjectIdPipe) sponsorId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventSponsorsService.removeSponsor(
      sponsorId,
      currentUser.id,
    );
  }

  @Get(':sponsorId/availability/:participantType')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Verificar disponibilidad de cuota',
    description:
      'Verifica si hay cuota disponible para un tipo específico de participante.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiParam({
    name: 'sponsorId',
    description: 'ID del patrocinador',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @ApiParam({
    name: 'participantType',
    description: 'Tipo de participante',
    enum: ParticipantType,
    example: ParticipantType.STAFF,
  })
  @ApiOkResponse({
    type: QuotaAvailabilityDto,
    description: 'Disponibilidad de cuota verificada',
  })
  @ApiNotFoundResponse({ description: 'Patrocinador no encontrado' })
  async checkAvailability(
    @Param('sponsorId', ParseObjectIdPipe) sponsorId: string,
    @Param('participantType') participantType: ParticipantType,
  ): Promise<QuotaAvailabilityDto> {
    const sponsor = await this.eventSponsorsService.findBySponsorId(sponsorId);

    if (!sponsor) {
      throw new Error('Sponsor not found');
    }

    let total = 0;
    let used = 0;

    switch (participantType) {
      case ParticipantType.STAFF:
        total = sponsor.staffQuota;
        used = sponsor.staffUsed;
        break;
      case ParticipantType.GUEST:
        total = sponsor.guestQuota;
        used = sponsor.guestUsed;
        break;
      case ParticipantType.SCHOLARSHIP:
        total = sponsor.scholarshipQuota;
        used = sponsor.scholarshipUsed;
        break;
    }

    const remaining = Math.max(0, total - used);

    return {
      available: remaining > 0,
      total,
      used,
      remaining,
    };
  }

  // --- Quota Requests Endpoints ---

  @Post('quota-requests')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Solicitar aumento de cupo',
    description:
      'Permite a un patrocinador solicitar más cupos para staff, invitados o becas.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiCreatedResponse({
    type: QuotaRequestDto,
    description: 'Solicitud creada exitosamente',
  })
  async requestQuota(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() createDto: CreateQuotaRequestDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventSponsorsService.createQuotaRequest(
      eventId,
      createDto,
      currentUser.id,
      currentUser.companyIds || [],
    );
  }

  @Get('quota-requests')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Listar solicitudes de cupo',
    description: 'Lista las solicitudes de aumento de cupo para el evento.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiQuery({
    name: 'status',
    enum: QuotaRequestStatus,
    required: false,
    description: 'Filtrar por estado',
  })
  @ApiOkResponse({
    type: [QuotaRequestDto],
    description: 'Lista de solicitudes',
  })
  async getQuotaRequests(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Query('status') status?: QuotaRequestStatus,
  ) {
    return await this.eventSponsorsService.getQuotaRequests(eventId, status);
  }

  @Get('my-quota-requests')
  @Roles(UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Mis solicitudes de cupo',
    description:
      'Lista las solicitudes realizadas por mi empresa para este evento.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    type: [QuotaRequestDto],
    description: 'Lista de mis solicitudes',
  })
  async getMyQuotaRequests(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventSponsorsService.getMyQuotaRequests(
      eventId,
      currentUser.companyIds || [],
    );
  }

  @Patch('quota-requests/:requestId/review')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Revisar solicitud de cupo',
    description: 'Aprobar o rechazar una solicitud de aumento de cupo.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiParam({
    name: 'requestId',
    description: 'ID de la solicitud',
    example: '66c0da2b6a3aa6ed3c63e005',
  })
  @ApiOkResponse({
    type: QuotaRequestDto,
    description: 'Solicitud revisada exitosamente',
  })
  async reviewQuotaRequest(
    @Param('requestId', ParseObjectIdPipe) requestId: string,
    @Body() reviewDto: ReviewQuotaRequestDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventSponsorsService.reviewQuotaRequest(
      requestId,
      reviewDto,
      currentUser.id,
    );
  }
}

@ApiTags('Patrocinadores de Eventos')
@Controller('event-sponsors/company')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class CompanySponsorEventsController {
  constructor(private readonly eventSponsorsService: EventSponsorsService) {}

  @Get(':companyId/events')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Obtener eventos patrocinados por una empresa (con paginación)',
    description:
      'Retorna todos los eventos donde la empresa es patrocinadora. ' +
      'Por defecto muestra TODOS los eventos sin importar su estado. ' +
      'Puedes filtrar por estado(s) específico(s) usando el query parameter "status". ' +
      'Soporta paginación mediante los parámetros page y limit.',
  })
  @ApiParam({
    name: 'companyId',
    description: 'ID de la empresa patrocinadora',
    example: '66c0da2b6a3aa6ed3c63e002',
  })
  @ApiQuery({
    name: 'status',
    description:
      'Estado(s) de eventos a filtrar (separados por coma). ' +
      'Ejemplos: "published" para solo activos, "published,completed" para activos e históricos. ' +
      'Si no se especifica, retorna TODOS los eventos.',
    required: false,
    example: 'published',
  })
  @ApiQuery({
    name: 'page',
    description: 'Número de página (comienza en 1)',
    required: false,
    example: 1,
    type: Number,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Cantidad de elementos por página (por defecto: 10)',
    required: false,
    example: 10,
    type: Number,
  })
  @ApiOkResponse({
    type: EventsPaginatedDto,
    description:
      'Lista paginada de eventos patrocinados, ordenados por fecha de inicio (más recientes primero)',
  })
  async getCompanySponsoredEvents(
    @Param('companyId', ParseObjectIdPipe) companyId: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<EventsPaginatedDto> {
    const eventStatuses = status
      ? (status.split(',').map((s) => s.trim()) as EventStatus[])
      : undefined;

    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 10;

    return await this.eventSponsorsService.getEventsByCompany(
      companyId,
      eventStatuses,
      pageNumber,
      limitNumber,
    );
  }
}
