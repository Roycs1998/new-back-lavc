import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CreateUserWithPersonDto } from 'src/persons/dto/create-user-with-person.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { StatusDto } from 'src/common/dto/status.dto';
import { UserDto } from './dto/user.dto';
import { UserPaginatedDto } from './dto/user-pagination.dto';

@ApiTags('Usuarios')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({
    summary: 'Crear un nuevo usuario (solo admin de plataforma)',
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario creado correctamente',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación en los datos',
  })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un usuario con sus datos personales' })
  @ApiResponse({
    status: 201,
    description: 'Usuario y persona creados correctamente',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'El correo ya existe o datos inválidos',
  })
  registerUserWithPerson(@Body() dto: CreateUserWithPersonDto) {
    return this.usersService.createUserWithPerson(dto);
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Obtener todos los usuarios (con filtros y paginación)',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de usuarios obtenido correctamente',
    type: UserPaginatedDto,
  })
  findAll(@Query() filter: UserFilterDto) {
    return this.usersService.findAll(filter);
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Obtener un usuario por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Usuario encontrado',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.USER)
  @ApiOperation({
    summary: 'Actualizar un usuario por ID (solo admin plataforma)',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuario actualizado correctamente',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Cambiar el estado del usuario (activo/eliminado)' })
  @ApiResponse({
    status: 200,
    description: 'Estado del usuario actualizado correctamente',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  changeStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: StatusDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.usersService.changeStatus(id, dto.entityStatus, currentUser.id);
  }

  @Patch(':id/verify-email')
  @ApiOperation({ summary: 'Verificar el correo electrónico del usuario' })
  @ApiResponse({
    status: 200,
    description: 'Correo verificado correctamente',
    type: UserDto,
  })
  @ApiResponse({ status: 404, description: 'Usuario no encontrado' })
  verifyEmail(@Param('id', ParseObjectIdPipe) id: string) {
    return this.usersService.verifyEmail(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Eliminar un usuario de manera lógica por ID' })
  @ApiResponse({ status: 204, description: 'Usuario eliminado correctamente' })
  async softDelete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<void> {
    await this.usersService.softDelete(id, currentUser.id);
  }

  @Get('me/staff-roles')
  @Roles(UserRole.USER, UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Obtener roles de staff del usuario autenticado',
    description:
      'Retorna los eventos donde el usuario es staff operativo y los sponsors donde es staff de sponsor',
  })
  @ApiResponse({
    status: 200,
    description: 'Roles de staff obtenidos correctamente',
    schema: {
      type: 'object',
      properties: {
        hasStaffRoles: { type: 'boolean' },
        operationalStaff: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              eventTitle: { type: 'string' },
              eventStartDate: { type: 'string' },
              eventEndDate: { type: 'string' },
              participantId: { type: 'string' },
              role: { type: 'string' },
              canAccess: { type: 'boolean' },
            },
          },
        },
        sponsorStaff: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              eventId: { type: 'string' },
              eventTitle: { type: 'string' },
              sponsorId: { type: 'string' },
              sponsorName: { type: 'string' },
              participantId: { type: 'string' },
              role: { type: 'string' },
              canAccess: { type: 'boolean' },
            },
          },
        },
      },
    },
  })
  getMyStaffRoles(@CurrentUser() currentUser: CurrentUserData) {
    return this.usersService.getAllStaffRoles(currentUser.id);
  }
}
