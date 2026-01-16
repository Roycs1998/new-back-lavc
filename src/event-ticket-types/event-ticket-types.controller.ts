import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyScopeGuard } from 'src/common/guards/company-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { EventTicketTypesService } from './event-ticket-types.service';
import { CreateTicketTypeDto } from './dto/create-ticket-type.dto';
import { UpdateTicketTypeDto } from './dto/update-ticket-type.dto';
import { TicketTypeDto } from './dto/ticket-type.dto';

@ApiTags('Event Ticket Types')
@Controller('events')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
export class EventTicketTypesController {
  constructor(
    private readonly eventTicketTypesService: EventTicketTypesService,
  ) {}

  @Get(':id/ticket-types')
  @ApiOperation({
    summary: 'Listar tipos de ticket de un evento',
    description:
      'Devuelve la lista de **Ticket Types** asociados al evento indicado por `:id`.',
  })
  @ApiOkResponse({
    type: [TicketTypeDto],
    description: 'Lista de tipos de ticket',
  })
  @Public()
  getEventTicketTypes(
    @Param('id', ParseObjectIdPipe) eventId: string,
  ): Promise<TicketTypeDto[]> {
    return this.eventTicketTypesService.getEventTicketTypes(eventId);
  }

  @Post(':id/ticket-types')
  @ApiOperation({
    summary: 'Crear tipo de ticket para un evento',
    description:
      'Crea un nuevo Ticket Type asociado al evento indicado por :id.',
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
    return this.eventTicketTypesService.createTicketType(
      eventId,
      createTicketTypeDto,
      currentUser.id,
    );
  }

  @Patch('ticket-types/:ticketTypeId')
  @ApiOperation({
    summary: 'Actualizar un tipo de ticket',
    description:
      'Actualiza los campos permitidos de un Ticket Type. No se permite modificar eventId ni sold directamente.',
  })
  @ApiOkResponse({
    type: TicketTypeDto,
    description: 'Tipo de ticket actualizado correctamente',
  })
  updateTicketType(
    @Param('ticketTypeId', ParseObjectIdPipe) ticketTypeId: string,
    @Body() updateData: UpdateTicketTypeDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<TicketTypeDto> {
    return this.eventTicketTypesService.updateTicketType(
      ticketTypeId,
      updateData,
      currentUser.id,
    );
  }

  @Delete('ticket-types/:ticketTypeId')
  @ApiOperation({
    summary: 'Eliminar un tipo de ticket',
    description:
      'Elimina un Ticket Type siempre que no tenga ventas (sold = 0).',
  })
  @ApiOkResponse({
    description: 'Tipo de ticket eliminado correctamente',
  })
  deleteTicketType(
    @Param('ticketTypeId', ParseObjectIdPipe) ticketTypeId: string,
  ): Promise<void> {
    return this.eventTicketTypesService.deleteTicketType(ticketTypeId);
  }
}
