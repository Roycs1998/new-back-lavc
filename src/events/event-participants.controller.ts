import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { EventParticipantsService } from './event-participants.service';
import { RegisterParticipantDto } from './dto/register-participant.dto';
import { EventParticipantDto } from './dto/event-participant.dto';
import { ListParticipantsQueryDto } from './dto/list-participants-query.dto';
import { PaginatedParticipantsDto } from './dto/paginated-participants.dto';
import { StaffAccessDto } from './dto/staff-access.dto';
import { AssignOperationalStaffDto } from './dto/assign-operational-staff.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Participantes de Eventos')
@Controller('events/:eventId/participants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
@ApiBearerAuth('JWT-auth')
export class EventParticipantsController {
  constructor(
    private readonly eventParticipantsService: EventParticipantsService,
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Registrar participante en un evento',
    description:
      'Registra un usuario como participante de un evento a través de un patrocinador con validación de cuotas.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiCreatedResponse({
    type: EventParticipantDto,
    description: 'Participante registrado exitosamente',
  })
  async registerParticipant(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() registerDto: RegisterParticipantDto,
  ): Promise<EventParticipantDto> {
    return await this.eventParticipantsService.registerParticipant(
      eventId,
      registerDto,
    );
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Listar participantes de un evento',
    description:
      'Obtiene los participantes de un evento con soporte para paginación, filtros y búsqueda.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    type: PaginatedParticipantsDto,
    description: 'Lista paginada de participantes obtenida exitosamente',
  })
  async listParticipants(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Query() query: ListParticipantsQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<PaginatedParticipantsDto> {
    return await this.eventParticipantsService.getParticipantsByEvent(
      eventId,
      query,
      currentUser,
    );
  }

  @Get('me')
  @ApiOperation({
    summary: 'Obtener mi participación en el evento',
    description: 'Obtiene la información de participación del usuario actual.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    type: EventParticipantDto,
    description: 'Participación del usuario obtenida exitosamente',
  })
  async getMyParticipation(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventParticipantsService.getParticipantByUserAndEvent(
      currentUser.id,
      eventId,
    );
  }

  @Get('staff')
  @ApiOperation({
    summary: 'Listar staff del evento',
    description:
      'Obtiene todos los miembros del staff registrados para el evento.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    type: [EventParticipantDto],
    description: 'Lista de staff obtenida exitosamente',
  })
  async getStaff(@Param('eventId', ParseObjectIdPipe) eventId: string) {
    return await this.eventParticipantsService.getStaffByEvent(eventId);
  }

  @Post('operational-staff')
  @ApiOperation({
    summary: 'Asignar staff operativo a un evento (solo PLATFORM_ADMIN)',
    description:
      'Asigna un usuario como staff operativo del evento. El staff tendrá acceso completo hasta que termine el evento.',
  })
  @ApiCreatedResponse({
    description: 'Staff operativo asignado correctamente',
    type: EventParticipantDto,
  })
  async assignOperationalStaff(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() dto: AssignOperationalStaffDto,
  ): Promise<EventParticipantDto> {
    return this.eventParticipantsService.assignOperationalStaff(eventId, dto);
  }

  @Get('operational-staff')
  @ApiOperation({
    summary: 'Listar staff operativo del evento',
    description:
      'Obtiene todos los usuarios asignados como staff operativo del evento.',
  })
  @ApiOkResponse({
    description: 'Lista de staff operativo',
    type: [EventParticipantDto],
  })
  async getOperationalStaff(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
  ): Promise<EventParticipantDto[]> {
    return this.eventParticipantsService.getOperationalStaffByEvent(eventId);
  }

  @Delete('operational-staff/:participantId')
  @ApiOperation({
    summary: 'Remover staff operativo (solo PLATFORM_ADMIN)',
    description: 'Desactiva la asignación de staff operativo de un usuario.',
  })
  @ApiParam({
    name: 'participantId',
    description: 'ID del participante (EventParticipant)',
  })
  @ApiOkResponse({ description: 'Staff operativo removido correctamente' })
  async removeOperationalStaff(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Param('participantId', ParseObjectIdPipe) participantId: string,
  ): Promise<void> {
    await this.eventParticipantsService.removeOperationalStaff(
      eventId,
      participantId,
    );
  }

  @Delete(':participantId')
  @ApiOperation({
    summary: 'Cancelar participación',
    description:
      'Cancela la participación de un usuario y libera la cuota utilizada.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiParam({
    name: 'participantId',
    description: 'ID del participante',
    example: '66c0da2b6a3aa6ed3c63e005',
  })
  @ApiOkResponse({
    type: EventParticipantDto,
    description: 'Participación cancelada exitosamente',
  })
  async cancelParticipation(
    @Param('participantId', ParseObjectIdPipe) participantId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.eventParticipantsService.cancelParticipation(
      participantId,
      currentUser.id,
    );
  }

  @Get('staff-access/check')
  @ApiOperation({
    summary: 'Verificar acceso al panel de staff',
    description:
      'Verifica si el usuario actual tiene acceso al panel de staff del evento (solo durante las fechas del evento).',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    type: StaffAccessDto,
    description: 'Verificación de acceso completada',
  })
  async checkStaffAccess(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const hasAccess = await this.eventParticipantsService.checkStaffAccess(
      currentUser.id,
      eventId,
    );

    return {
      hasAccess,
      isStaff: hasAccess,
      isEventActive: hasAccess,
    };
  }

  @Post('sync-speakers')
  @ApiOperation({
    summary: 'Sincronizar speakers del evento con participantes',
    description:
      'Sincroniza la lista de speakers del evento con EventParticipant. Agrega nuevos speakers como participantes tipo SPEAKER y desactiva los que fueron removidos.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    description: 'Speakers sincronizados exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Speakers sincronizados exitosamente',
        },
        syncedCount: { type: 'number', example: 3 },
      },
    },
  })
  async syncSpeakers(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() syncSpeakersDto: { speakers: string[] },
  ) {
    await this.eventParticipantsService.syncSpeakersAsParticipants(
      eventId,
      syncSpeakersDto.speakers,
    );

    return {
      message: 'Speakers sincronizados exitosamente',
      syncedCount: syncSpeakersDto.speakers.length,
    };
  }
}
