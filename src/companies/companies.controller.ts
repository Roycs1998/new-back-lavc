import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { CompanyFilterDto } from './dto/company-filter.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { CompanyDto } from './dto/company.dto';
import { CompanyPaginatedDto } from './dto/company-pagination.dto';
import { ChangeCompanyStatusDto } from './dto/change-company-status.dto';

@ApiTags('Empresas')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una empresa' })
  @ApiResponse({
    status: 201,
    description: 'Empresa creada correctamente',
    type: CompanyDto,
  })
  create(@Body() dto: CreateCompanyDto): Promise<CompanyDto> {
    return this.companiesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar empresas (filtros + paginación)' })
  @ApiResponse({
    status: 200,
    description: 'Listado de empresas obtenido correctamente',
    type: CompanyPaginatedDto,
  })
  findAll(@Query() filter: CompanyFilterDto): Promise<CompanyPaginatedDto> {
    return this.companiesService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una empresa por ID' })
  @ApiResponse({
    status: 200,
    description: 'Empresa encontrada',
    type: CompanyDto,
  })
  findOne(@Param('id', ParseObjectIdPipe) id: string): Promise<CompanyDto> {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar una empresa por ID' })
  @ApiResponse({
    status: 200,
    description: 'Empresa actualizada',
    type: CompanyDto,
  })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyDto> {
    return this.companiesService.update(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Cambiar estado de una empresa (ACTIVE/INACTIVE/DELETED)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estado actualizado',
    type: CompanyDto,
  })
  changeStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: ChangeCompanyStatusDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<CompanyDto> {
    return this.companiesService.changeStatus(
      id,
      dto.entityStatus,
      currentUser?.id,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar lógicamente una empresa por ID' })
  @ApiResponse({
    status: 204,
    description: 'Empresa eliminada (soft delete) correctamente',
  })
  async remove(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<void> {
    await this.companiesService.softDelete(id, currentUser?.id);
  }

  @Patch(':id/logo')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Actualizar logo de la empresa' })
  @ApiResponse({ status: 200, type: CompanyDto })
  async updateLogo(
    @Param('id', ParseObjectIdPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó archivo');
    }

    return await this.companiesService.updateCompanyLogo(
      id,
      file.buffer,
      file.originalname,
      file.mimetype,
    );
  }

  @Delete(':id/logo')
  @ApiOperation({ summary: 'Eliminar logo de la empresa' })
  @ApiResponse({ status: 200, type: CompanyDto })
  async deleteLogo(@Param('id', ParseObjectIdPipe) id: string) {
    return await this.companiesService.deleteCompanyLogo(id);
  }
}
