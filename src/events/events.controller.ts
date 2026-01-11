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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyScopeGuard } from 'src/common/guards/company-scope.guard';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { EventFilterDto } from './dto/event-filter.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { ChangeEventStatusDto } from './dto/change-event-status.dto';
import { EventDto } from './dto/event.dto';
import { EventPaginatedDto } from './dto/event-pagination.dto';
import { CancelEventDto } from './dto/cancel-event.dto';
import { EventStatsDto } from './dto/event-stats.dto';
import { CompanyEventStatsDto } from './dto/company-event-stats.dto';
import { TicketTypeDto } from './dto/ticket-type.dto';

@ApiTags('Eventos')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Crear un nuevo evento' })
  @ApiBearerAuth('JWT-auth')
  @ApiCreatedResponse({
    type: EventDto,
    description: 'Evento creado correctamente',
  })
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventDto> {
    return this.eventsService.create(createEventDto, currentUser.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Listar eventos con filtros avanzados (privado)' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    type: EventPaginatedDto,
    description: 'Eventos obtenidos correctamente',
  })
  findAll(
    @Query() filterDto: EventFilterDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventPaginatedDto> {
    return this.eventsService.findAll(filterDto, currentUser);
  }

  @Get('featured')
  @Public()
  @ApiOperation({
    summary: 'Obtener evento destacado para homepage',
    description:
      'Retorna el evento principal a mostrar en la p\u00e1gina de inicio. ' +
      'Selecci\u00f3n autom\u00e1tica por: Featured > Prioridad > Fecha cercana',
  })
  @ApiOkResponse({
    type: EventDto,
    description: 'Evento destacado obtenido correctamente',
  })
  @ApiResponse({ status: 404, description: 'No hay eventos disponibles' })
  getFeaturedEvent(): Promise<EventDto> {
    return this.eventsService.getFeaturedEvent();
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Listar eventos publicados (acceso público)' })
  @ApiOkResponse({
    type: EventPaginatedDto,
    description: 'Eventos publicados obtenidos correctamente',
  })
  findAllPublic(
    @Query() filterDto: EventFilterDto,
  ): Promise<EventPaginatedDto> {
    const publicFilter = { ...filterDto, eventStatus: EventStatus.PUBLISHED };
    return this.eventsService.findAll(publicFilter);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Obtener un evento por ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: EventDto, description: 'Evento encontrado' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventDto> {
    return this.eventsService.findOne(id, currentUser);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Obtener un evento por slug (público)' })
  @ApiOkResponse({ type: EventDto, description: 'Evento encontrado' })
  findBySlug(@Param('slug') slug: string): Promise<EventDto> {
    return this.eventsService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Actualizar un evento por ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    type: EventDto,
    description: 'Evento actualizado correctamente',
  })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventDto> {
    return this.eventsService.update(id, updateEventDto, currentUser.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Cambiar el estado del evento (solo Platform Admin)',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    type: EventDto,
    description: 'Estado del evento actualizado',
  })
  @ApiBody({
    description:
      'Cambia el estado del evento. Si se envía REJECTED, debe incluirse "rejectionReason".',
    examples: {
      aprobar: {
        summary: 'Aprobar evento',
        value: { eventStatus: EventStatus.APPROVED },
      },
      rechazar: {
        summary: 'Rechazar evento',
        value: {
          eventStatus: EventStatus.REJECTED,
          rejectionReason: 'No cumple lineamientos editoriales',
        },
      },
    },
  })
  changeEventStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ChangeEventStatusDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventDto> {
    return this.eventsService.changeEventStatus(
      id,
      dto.eventStatus,
      currentUser.id,
      dto.rejectionReason,
    );
  }

  @Post(':id/submit')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.COMPANY_ADMIN, UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Enviar evento a revisión',
    description:
      'Transiciona el evento de **DRAFT** a **PENDING_APPROVAL** tras validar datos mínimos.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del evento (Mongo ObjectId)',
    example: '66d0a1c9b8f2a84f0a3f1123',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: EventDto, description: 'Evento enviado a revisión' })
  submitForReview(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eventsService.submitForReview(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Publicar un evento aprobado' })
  @ApiOkResponse({ type: EventDto, description: 'Evento publicado' })
  publish(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.publish(id, currentUser.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Cancelar un evento' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({ type: EventDto, description: 'Evento cancelado' })
  cancel(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: CancelEventDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<EventDto> {
    return this.eventsService.cancel(id, currentUser.id, body?.reason);
  }

  @Get('company/:companyId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas agregadas por empresa' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    type: CompanyEventStatsDto,
    description: 'Estadísticas obtenidas',
  })
  getCompanyStats(
    @Param('companyId', ParseObjectIdPipe) companyId: string,
  ): Promise<CompanyEventStatsDto> {
    return this.eventsService.getCompanyEventStats(companyId);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Obtener estadísticas detalladas de un evento' })
  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    type: EventStatsDto,
    description: 'Estadísticas del evento obtenidas',
  })
  getEventStats(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<EventStatsDto> {
    return this.eventsService.getEventStats(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Soft delete event by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Event soft deleted successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  softDelete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.softDelete(id, currentUser.id);
  }

  @Post(':id/ticket-types')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Crear tipo de ticket para un evento',
    description:
      'Crea un nuevo **Ticket Type** asociado al evento indicado por `:id`.',
  })
  @ApiCreatedResponse({
    type: TicketTypeDto,
    description: 'Tipo de ticket creado correctamente',
  })
  createTicketType(
    @Param('id', ParseObjectIdPipe) eventId: string,
    @Body() createTicketTypeDto: CreateTicketTypeDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<TicketTypeDto> {
    return this.eventsService.createTicketType(
      eventId,
      createTicketTypeDto,
      currentUser.id,
    );
  }

  @Patch('ticket-types/:ticketTypeId')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Actualizar un tipo de ticket',
    description:
      'Actualiza los campos permitidos de un **Ticket Type**. No se permite modificar `eventId` ni `sold` directamente.',
  })
  @ApiOkResponse({
    type: TicketTypeDto,
    description: 'Tipo de ticket actualizado correctamente',
  })
  updateTicketType(
    @Param('ticketTypeId', ParseObjectIdPipe) ticketTypeId: string,
    @Body() updateData: any,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<TicketTypeDto> {
    return this.eventsService.updateTicketType(
      ticketTypeId,
      updateData,
      currentUser.id,
    );
  }

  @Delete('ticket-types/:ticketTypeId')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Eliminar un tipo de ticket',
    description:
      'Elimina un **Ticket Type** siempre que no tenga ventas (`sold = 0`).',
  })
  @ApiOkResponse({
    description: 'Tipo de ticket eliminado correctamente',
  })
  deleteTicketType(
    @Param('ticketTypeId', ParseObjectIdPipe) ticketTypeId: string,
  ) {
    return this.eventsService.deleteTicketType(ticketTypeId);
  }

  @Get(':id/ticket-types')
  @Public()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar tipos de ticket de un evento (acceso público)',
  })
  @ApiOkResponse({
    type: [TicketTypeDto],
    description: 'Tipos de ticket obtenidos correctamente',
  })
  getEventTicketTypes(
    @Param('id', ParseObjectIdPipe) eventId: string,
  ): Promise<TicketTypeDto[]> {
    return this.eventsService.getEventTicketTypes(eventId);
  }
}
