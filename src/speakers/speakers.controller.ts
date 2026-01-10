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
import { SpeakersService } from './speakers.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyScopeGuard } from 'src/common/guards/company-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { CreateSpeakerWithPersonDto } from 'src/persons/dto/create-speaker-with-person.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { StatusDto } from 'src/common/dto/status.dto';
import { SpeakerDto } from './dto/speaker.dto';
import { SpeakerPaginatedDto } from './dto/speaker-pagination.dto';

@ApiTags('Oradores')
@Controller('speakers')
@UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
@ApiBearerAuth('JWT-auth')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) { }

  @Post()
  @ApiOperation({ summary: 'Crear speaker y su persona en un solo paso' })
  @ApiCreatedResponse({ type: SpeakerDto })
  @ApiBadRequestResponse({
    description: 'Validación fallida o empresa inactiva',
  })
  create(
    @Body() createSpeakerWithPersonDto: CreateSpeakerWithPersonDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.createSpeakerWithPerson(
      createSpeakerWithPersonDto,
      currentUser.id,
    );
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar speakers (paginado y filtrado)',
    description:
      'Soporta búsqueda full-text (search), filtros por company, specialty, arrays (languages/topics), rangos (años/fee), fechas y orden dinámico.',
  })
  @ApiOkResponse({ type: SpeakerPaginatedDto })
  findAll(@Query() filterDto: SpeakerFilterDto) {
    return this.speakersService.findAll(filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una exponente por ID' })
  @ApiResponse({
    status: 200,
    description: 'Exponente encontrada',
    type: SpeakerDto,
  })
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<SpeakerDto> {
    return this.speakersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un speaker' })
  @ApiOkResponse({ type: SpeakerDto })
  @ApiBadRequestResponse({ description: 'Validación fallida' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateSpeakerDto: UpdateSpeakerDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.update(id, updateSpeakerDto, currentUser.id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambiar el estado lógico del speaker (ACTIVE/INACTIVE/DELETED)',
  })
  @ApiOkResponse({ type: SpeakerDto })
  changeStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: StatusDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.changeStatus(
      id,
      dto.entityStatus,
      currentUser.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar lógicamente un speaker' })
  @ApiOkResponse({ type: SpeakerDto })
  softDelete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.softDelete(id, currentUser.id);
  }
}
