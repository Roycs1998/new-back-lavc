import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { PersonsService } from './persons.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { PersonFilterDto } from './dto/person-filter.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { StatusDto } from 'src/common/dto/status.dto';
import { PersonDto } from './dto/person.dto';
import { PersonPaginatedDto } from './dto/person-pagination.dto';

@ApiTags('Personas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('persons')
export class PersonsController {
  constructor(private readonly personsService: PersonsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Crea una nueva persona' })
  @ApiResponse({
    status: 201,
    description: 'Persona creada correctamente',
    type: PersonDto,
  })
  @ApiResponse({ status: 400, description: 'Error de validación en los datos' })
  create(@Body() createPersonDto: CreatePersonDto): Promise<PersonDto> {
    return this.personsService.create(createPersonDto);
  }

  @Get()
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Obtener todas las personas con filtros' })
  @ApiResponse({
    status: 200,
    description: 'Listado de personas obtenido correctamente',
    type: PersonPaginatedDto,
  })
  findAll(@Query() filterDto: PersonFilterDto): Promise<PersonPaginatedDto> {
    return this.personsService.findAll(filterDto);
  }

  @Get(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Obtener persona por su ID' })
  @ApiResponse({
    status: 200,
    description: 'Persona encontrada',
    type: PersonDto,
  })
  @ApiResponse({ status: 404, description: 'Persona no encontrada' })
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<PersonDto> {
    return this.personsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Actualizar persona por ID' })
  @ApiResponse({
    status: 200,
    description: 'Persona actualizada correctamente',
    type: PersonDto,
  })
  @ApiResponse({ status: 404, description: 'Persona no encontrada' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updatePersonDto: UpdatePersonDto,
  ): Promise<PersonDto> {
    return this.personsService.update(id, updatePersonDto);
  }

  @Patch(':id/status')
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({
    summary: 'Cambiar estado de la persona (ej: activo, eliminado)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado de la persona actualizado correctamente',
    type: PersonDto,
  })
  @ApiResponse({ status: 404, description: 'Persona no encontrada' })
  changeStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: StatusDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<PersonDto> {
    return this.personsService.changeStatus(
      id,
      dto.entityStatus,
      currentUser.id,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Eliminar persona lógicamente por ID' })
  @ApiResponse({ status: 204, description: 'Persona eliminada correctamente' })
  async softDelete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<void> {
    await this.personsService.softDelete(id, currentUser.id);
  }
}
