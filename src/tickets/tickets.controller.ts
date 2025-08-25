import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../common/pipes/parse-object-id.pipe';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Tickets')
@Controller('tickets')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('my-tickets')
  @ApiOperation({ summary: 'Get user tickets' })
  @ApiResponse({ status: 200, description: 'Tickets retrieved successfully' })
  getUserTickets(@CurrentUser() currentUser: CurrentUserData) {
    return this.ticketsService.getUserTickets(currentUser.id);
  }

  @Get('events/:eventId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Get event tickets (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Event tickets retrieved successfully',
  })
  getEventTickets(@Param('eventId', ParseObjectIdPipe) eventId: string) {
    return this.ticketsService.getEventTickets(eventId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ticket details' })
  @ApiResponse({ status: 200, description: 'Ticket found' })
  @ApiResponse({ status: 404, description: 'Ticket not found' })
  getTicket(@Param('id', ParseObjectIdPipe) id: string) {
    return this.ticketsService.findOne(id);
  }

  @Patch(':id/attendee')
  @ApiOperation({ summary: 'Update attendee information' })
  @ApiResponse({
    status: 200,
    description: 'Attendee info updated successfully',
  })
  updateAttendeeInfo(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() attendeeInfo: any,
  ) {
    return this.ticketsService.updateAttendeeInfo(id, attendeeInfo);
  }

  @Patch(':id/transfer')
  @ApiOperation({ summary: 'Transfer ticket to another user' })
  @ApiResponse({ status: 200, description: 'Ticket transferred successfully' })
  transferTicket(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('newUserId') newUserId: string,
  ) {
    return this.ticketsService.transferTicket(id, newUserId);
  }
}
