import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
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
import { CompanyScope } from 'src/common/decorators/company-scope.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { EventFilterDto } from './dto/event-filter.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { EventStatus } from 'src/common/enums/event-status.enum';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { ChangeEventStatusDto } from './dto/change-event-status.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Event created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  create(
    @Body() createEventDto: CreateEventDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.create(createEventDto, currentUser.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get all events with advanced filtering' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  findAll(
    @Query() filterDto: EventFilterDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.findAll(filterDto, currentUser);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get published events (public access)' })
  @ApiResponse({
    status: 200,
    description: 'Published events retrieved successfully',
  })
  findAllPublic(@Query() filterDto: EventFilterDto) {
    const publicFilter = { ...filterDto, eventStatus: EventStatus.PUBLISHED };
    return this.eventsService.findAll(publicFilter);
  }

  @Get('company/:companyId/stats')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Get event statistics for company' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Company event statistics retrieved successfully',
  })
  getCompanyStats(@Param('companyId', ParseObjectIdPipe) companyId: string) {
    return this.eventsService.getCompanyEventStats(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get event by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findOne(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.findOne(id, false, currentUser);
  }

  @Get('slug/:slug')
  @Public()
  @ApiOperation({ summary: 'Get event by slug (public access)' })
  @ApiResponse({ status: 200, description: 'Event found' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Get detailed event statistics' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Event statistics retrieved successfully',
  })
  getEventStats(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eventsService.getEventStats(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Update event by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Event updated successfully' })
  @ApiResponse({ status: 404, description: 'Event not found' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateEventDto: UpdateEventDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.update(id, updateEventDto, currentUser.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Change event status (Platform Admin only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Event status updated successfully',
  })
  @ApiBody({
    description:
      'Cambia el estado del evento. Si es REJECTED debes enviar rejectionReason.',
    examples: {
      approve: {
        summary: 'Aprobar evento',
        value: { eventStatus: EventStatus.APPROVED },
      },
      reject: {
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
  ) {
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
      'Transiciona el evento de **DRAFT** a **PENDING_APPROVAL**. ' +
      'Solo los administradores de la empresa dueña pueden ejecutar esta acción. ' +
      'Precondiciones: el evento debe estar en estado **DRAFT** y pasar las validaciones básicas (fechas, location, capacity).',
  })
  @ApiParam({
    name: 'id',
    description: 'ID del evento (Mongo ObjectId)',
    example: '66d0a1c9b8f2a84f0a3f1123',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Evento enviado a revisión (estado: PENDING_APPROVAL).',
  })
  submitForReview(@Param('id', ParseObjectIdPipe) id: string) {
    return this.eventsService.submitForReview(id);
  }

  @Patch(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Publish approved event' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Event published successfully' })
  @ApiResponse({
    status: 400,
    description: 'Event must be approved before publishing',
  })
  publish(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.publish(id, currentUser.id);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Cancel event' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Event cancelled successfully' })
  cancel(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.cancel(id, currentUser.id, reason);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
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
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Create ticket type for event' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Ticket type created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  createTicketType(
    @Param('id', ParseObjectIdPipe) eventId: string,
    @Body() createTicketTypeDto: CreateTicketTypeDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.createTicketType(
      eventId,
      createTicketTypeDto,
      currentUser.id,
    );
  }

  @Get(':id/ticket-types')
  @Public()
  @ApiOperation({ summary: 'Get ticket types for event (public access)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Ticket types retrieved successfully',
  })
  getEventTicketTypes(@Param('id', ParseObjectIdPipe) eventId: string) {
    return this.eventsService.getEventTicketTypes(eventId);
  }

  @Patch('ticket-types/:ticketTypeId')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Update ticket type' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Ticket type updated successfully' })
  updateTicketType(
    @Param('ticketTypeId', ParseObjectIdPipe) ticketTypeId: string,
    @Body() updateData: any,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.eventsService.updateTicketType(
      ticketTypeId,
      updateData,
      currentUser.id,
    );
  }

  @Delete('ticket-types/:ticketTypeId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Delete ticket type' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 204, description: 'Ticket type deleted successfully' })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete ticket type with sales',
  })
  deleteTicketType(
    @Param('ticketTypeId', ParseObjectIdPipe) ticketTypeId: string,
  ) {
    return this.eventsService.deleteTicketType(ticketTypeId);
  }
}
