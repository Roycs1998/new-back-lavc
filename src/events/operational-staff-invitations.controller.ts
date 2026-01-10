import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiCreatedResponse,
  ApiParam,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { SponsorInvitationsService } from './sponsor-invitations.service';
import { CreateSponsorInvitationDto } from './dto/create-sponsor-invitation.dto';
import { SponsorInvitationDto } from './dto/sponsor-invitation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Invitaciones de Staff Operativo')
@Controller('events/:eventId/operational-staff-invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class OperationalStaffInvitationsController {
  constructor(private readonly invitationsService: SponsorInvitationsService) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Crear invitación para staff operativo (solo PLATFORM_ADMIN)',
    description:
      'Genera un código único de invitación para que usuarios se registren como staff operativo del evento.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiCreatedResponse({
    type: SponsorInvitationDto,
    description: 'Invitación creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'Parámetros inválidos',
  })
  async createInvitation(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Body() createDto: CreateSponsorInvitationDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.invitationsService.createInvitation(
      eventId,
      createDto,
      currentUser.id,
    );
  }
}
