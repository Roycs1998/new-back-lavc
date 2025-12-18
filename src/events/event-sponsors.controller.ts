import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
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
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { EventSponsorsService } from './event-sponsors.service';
import { CreateEventSponsorDto } from './dto/create-event-sponsor.dto';
import { UpdateEventSponsorDto } from './dto/update-event-sponsor.dto';
import { EventSponsorDto } from './dto/event-sponsor.dto';
import { QuotaAvailabilityDto } from './dto/quota-availability.dto';
import { ParticipantType } from '../common/enums/participant-type.enum';
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
}
