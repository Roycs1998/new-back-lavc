import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  UseGuards,
  HttpStatus,
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

@ApiTags('Oradoras')
@Controller('speakers')
@UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
@ApiBearerAuth('JWT-auth')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post('with-person')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Crear speaker y su persona en un solo paso' })
  @ApiCreatedResponse({ type: SpeakerDto })
  @ApiBadRequestResponse({
    description: 'Validación fallida o empresa inactiva',
  })
  createSpeakerWithPerson(
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

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
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
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Eliminar lógicamente un speaker' })
  @ApiOkResponse({ type: SpeakerDto })
  softDelete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.softDelete(id, currentUser.id);
  }
}
