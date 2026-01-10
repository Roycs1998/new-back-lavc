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
  BadRequestException,
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
import { SponsorInvitationsService } from './sponsor-invitations.service';
import { CreateSponsorInvitationDto } from './dto/create-sponsor-invitation.dto';
import { UpdateSponsorInvitationDto } from './dto/update-sponsor-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { AcceptInvitationForUserDto } from './dto/accept-invitation-for-user.dto';
import { SponsorInvitationDto } from './dto/sponsor-invitation.dto';
import { CreateBulkInvitationsDto } from './dto/create-bulk-invitations.dto';
import { BulkInvitationsResponseDto } from './dto/bulk-invitations-response.dto';
import { ListInvitationsQueryDto } from './dto/list-invitations-query.dto';
import { PaginatedInvitationsDto } from './dto/paginated-invitations.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('Invitaciones de Eventos')
@Controller('events/:eventId/invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class EventInvitationsController {
  constructor(private readonly invitationsService: SponsorInvitationsService) {}

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Listar todas las invitaciones del evento',
    description:
      'Obtiene todas las invitaciones de un evento con filtros opcionales. Los COMPANY_ADMIN solo ven invitaciones de sponsors de su empresa.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @ApiOkResponse({
    type: PaginatedInvitationsDto,
    description: 'Lista paginada de invitaciones obtenida exitosamente',
  })
  async listAllInvitations(
    @Param('eventId', ParseObjectIdPipe) eventId: string,
    @Query() filters: ListInvitationsQueryDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const userCompanyId = currentUser.roles.includes('company_admin')
      ? currentUser.companyId
      : undefined;

    return await this.invitationsService.getAllInvitationsForEvent(
      eventId,
      filters,
      userCompanyId,
    );
  }
}

@ApiTags('Invitaciones de Sponsors')
@Controller('events/:eventId/sponsors/:sponsorId/invitations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
@ApiBearerAuth('JWT-auth')
export class SponsorInvitationsController {
  constructor(private readonly invitationsService: SponsorInvitationsService) {}

  @Post()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Crear invitación',
    description:
      'Genera un código único de invitación para que usuarios se auto-registren al evento.',
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
  @ApiCreatedResponse({
    type: SponsorInvitationDto,
    description: 'Invitación creada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'No hay cuota disponible o parámetros inválidos',
  })
  async createInvitation(
    @Param('sponsorId', ParseObjectIdPipe) sponsorId: string,
    @Body() createDto: CreateSponsorInvitationDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.invitationsService.createInvitation(
      sponsorId,
      createDto,
      currentUser.id,
    );
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Crear múltiples invitaciones',
    description:
      'Genera múltiples códigos únicos de invitación de uso único para el mismo evento y sponsor',
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
  @ApiCreatedResponse({
    type: BulkInvitationsResponseDto,
    description: 'Invitaciones creadas exitosamente',
  })
  async createBulkInvitations(
    @Param('sponsorId', ParseObjectIdPipe) sponsorId: string,
    @Body() createDto: CreateBulkInvitationsDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return await this.invitationsService.createBulkInvitations(
      sponsorId,
      createDto,
      currentUser.id,
    );
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Listar invitaciones',
    description: 'Obtiene todas las invitaciones de un patrocinador.',
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
    type: [SponsorInvitationDto],
    description: 'Lista de invitaciones obtenida exitosamente',
  })
  async listInvitations(
    @Param('sponsorId', ParseObjectIdPipe) sponsorId: string,
  ) {
    return await this.invitationsService.getInvitationsByEventSponsor(
      sponsorId,
    );
  }

  @Get(':invitationId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Ver detalles de invitación',
    description:
      'Obtiene información detallada incluyendo estadísticas de uso.',
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
    name: 'invitationId',
    description: 'ID de la invitación',
    example: '66c0da2b6a3aa6ed3c63e020',
  })
  @ApiOkResponse({
    type: SponsorInvitationDto,
    description: 'Detalles de la invitación obtenidos exitosamente',
  })
  @ApiNotFoundResponse({ description: 'Invitación no encontrada' })
  async getInvitationDetails(
    @Param('invitationId', ParseObjectIdPipe) invitationId: string,
  ) {
    return await this.invitationsService.getInvitationDetails(invitationId);
  }

  @Patch(':invitationId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Actualizar invitación',
    description:
      'Modifica parámetros de la invitación como límites de uso o fecha de expiración.',
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
    name: 'invitationId',
    description: 'ID de la invitación',
    example: '66c0da2b6a3aa6ed3c63e020',
  })
  @ApiOkResponse({
    type: SponsorInvitationDto,
    description: 'Invitación actualizada exitosamente',
  })
  @ApiBadRequestResponse({
    description: 'No se puede reducir maxUses por debajo de usos actuales',
  })
  async updateInvitation(
    @Param('invitationId', ParseObjectIdPipe) invitationId: string,
    @Body() updateDto: UpdateSponsorInvitationDto,
  ) {
    return await this.invitationsService.updateInvitation(
      invitationId,
      updateDto,
    );
  }

  @Delete(':invitationId')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desactivar invitación',
    description: 'Desactiva una invitación para que no pueda ser utilizada.',
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
    name: 'invitationId',
    description: 'ID de la invitación',
    example: '66c0da2b6a3aa6ed3c63e020',
  })
  @ApiOkResponse({
    type: SponsorInvitationDto,
    description: 'Invitación desactivada exitosamente',
  })
  async deactivateInvitation(
    @Param('invitationId', ParseObjectIdPipe) invitationId: string,
  ) {
    return await this.invitationsService.deactivateInvitation(invitationId);
  }
}

@ApiTags('Invitaciones Públicas')
@Controller('invitations')
export class PublicInvitationsController {
  constructor(private readonly invitationsService: SponsorInvitationsService) {}

  @Get(':code/validate')
  @Public()
  @ApiOperation({
    summary: 'Validar código de invitación',
    description:
      'Verifica si un código de invitación es válido y retorna información del evento (endpoint público).',
  })
  @ApiParam({
    name: 'code',
    description: 'Código de invitación',
    example: 'ACME2025-XYZ789',
  })
  @ApiOkResponse({
    description: 'Información de validación de la invitación',
  })
  @ApiNotFoundResponse({ description: 'Código de invitación no válido' })
  async validateInvitation(@Param('code') code: string) {
    return await this.invitationsService.validateInvitationByCode(code);
  }

  @Post(':code/accept')
  @Public()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({
    summary: 'Aceptar invitación',
    description:
      'Acepta una invitación y registra al usuario en el evento. Si hay sesión activa (token JWT), usa el usuario autenticado. Si no hay sesión, crea un nuevo usuario con los datos proporcionados (endpoint público).',
  })
  @ApiParam({
    name: 'code',
    description: 'Código de invitación',
    example: 'ACME2025-XYZ789',
  })
  @ApiCreatedResponse({
    description: 'Invitación aceptada y usuario registrado exitosamente',
  })
  async acceptInvitation(
    @Param('code') code: string,
    @Body() acceptDto: AcceptInvitationDto,
    @CurrentUser() currentUser?: CurrentUserData,
  ) {
    if (currentUser?.id) {
      return await this.invitationsService.acceptInvitationWithAuth(
        code,
        currentUser.id,
      );
    }

    if (
      !acceptDto.email ||
      !acceptDto.password ||
      !acceptDto.firstName ||
      !acceptDto.lastName
    ) {
      throw new BadRequestException(
        'Se requieren email, firstName, lastName y password para usuarios sin sesión',
      );
    }

    return await this.invitationsService.acceptInvitationWithSignup(
      code,
      acceptDto,
    );
  }

  @Post(':code/accept-for-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Aceptar invitación en nombre de un usuario (Admin)',
    description:
      'Permite a un administrador registrar a un usuario existente en un evento usando su ID y un código de invitación.',
  })
  @ApiParam({
    name: 'code',
    description: 'Código de invitación',
    example: 'ACME2025-XYZ789',
  })
  @ApiCreatedResponse({
    description: 'Usuario registrado en el evento exitosamente',
  })
  async acceptInvitationForUser(
    @Param('code') code: string,
    @Body() acceptDto: AcceptInvitationForUserDto,
  ) {
    return await this.invitationsService.acceptInvitationForUser(
      code,
      acceptDto,
    );
  }
}
