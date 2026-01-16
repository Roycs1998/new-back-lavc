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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { SpeakersService } from './speakers.service';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { CreateSpeakerWithUserDto } from './dto/create-speaker-with-user.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { StatusDto } from 'src/common/dto/status.dto';
import { SpeakerDto } from './dto/speaker.dto';
import { SpeakerPaginatedDto } from './dto/speaker-pagination.dto';

@ApiTags('Oradores')
@Controller('speakers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
@ApiBearerAuth('JWT-auth')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  @ApiOperation({ summary: 'Crear speaker y su usuario en un solo paso' })
  @ApiCreatedResponse({ type: SpeakerDto })
  create(
    @Body() createSpeakerWithUserDto: CreateSpeakerWithUserDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<SpeakerDto> {
    return this.speakersService.createSpeakerWithUser(
      createSpeakerWithUserDto,
      currentUser.id,
    );
  }

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Listar speakers (paginado y filtrado)',
    description:
      'Soporta búsqueda full-text (search), filtros por specialty, arrays (languages/topics), rangos (años/fee), fechas y orden dinámico.',
  })
  @ApiOkResponse({ type: SpeakerPaginatedDto })
  findAll(@Query() filterDto: SpeakerFilterDto): Promise<SpeakerPaginatedDto> {
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
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() updateSpeakerDto: UpdateSpeakerDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<SpeakerDto> {
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
  ): Promise<SpeakerDto> {
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
  ): Promise<SpeakerDto> {
    return this.speakersService.softDelete(id, currentUser.id);
  }

  @Patch(':id/photo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Actualizar foto del speaker',
    description:
      'Sube una nueva foto para el speaker y elimina la foto anterior si existe. La foto se almacena en la entidad Person asociada.',
  })
  @ApiOkResponse({ type: SpeakerDto })
  async updatePhoto(
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<SpeakerDto> {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return await this.speakersService.updateSpeakerPhoto(
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Delete(':id/photo')
  @ApiOperation({
    summary: 'Eliminar foto del speaker',
    description:
      'Elimina la foto del speaker del storage y remueve la referencia de la entidad Person.',
  })
  @ApiOkResponse({ type: SpeakerDto })
  async deletePhoto(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<SpeakerDto> {
    return await this.speakersService.deleteSpeakerPhoto(id);
  }
}
