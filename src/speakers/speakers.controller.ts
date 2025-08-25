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
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyScopeGuard } from 'src/common/guards/company-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { CompanyScope } from 'src/common/decorators/company-scope.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import type { CurrentUserData } from 'src/common/decorators/current-user.decorator';
import { CreateSpeakerWithPersonDto } from 'src/persons/dto/create-speaker-with-person.dto';
import { SpeakerFilterDto } from './dto/speaker-filter.dto';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { ParseObjectIdPipe } from '@nestjs/mongoose';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { StatusDto } from 'src/common/dto/status.dto';

@Controller('speakers')
export class SpeakersController {
  constructor(private readonly speakersService: SpeakersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Create a new speaker (Admin only)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 201, description: 'Speaker created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  create(
    @Body() createSpeakerDto: CreateSpeakerDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.create(createSpeakerDto, currentUser.id);
  }

  @Post('create-with-person')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Create speaker with person data in one operation' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 201,
    description: 'Speaker and person created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
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
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  @ApiOperation({ summary: 'Get all speakers with advanced filtering' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Speakers retrieved successfully' })
  findAll(
    @Query() filterDto: SpeakerFilterDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.findAll(filterDto, currentUser);
  }

  @Get('public')
  @Public()
  @ApiOperation({ summary: 'Get active speakers (public access)' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Active speakers retrieved successfully',
  })
  findAllPublic(@Query() filterDto: SpeakerFilterDto) {
    return this.speakersService.findAll(filterDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Update speaker by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({ status: 200, description: 'Speaker updated successfully' })
  @ApiResponse({ status: 404, description: 'Speaker not found' })
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
  @CompanyScope()
  @ApiOperation({ summary: 'Change speaker status' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Speaker status updated successfully',
  })
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

  @Patch(':id/editable-users/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Add user to speaker editable list' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'User added to editable list successfully',
  })
  addEditableUser(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('userId', ParseObjectIdPipe) userId: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.addEditableUser(id, userId, currentUser.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @CompanyScope()
  @ApiOperation({ summary: 'Soft delete speaker by ID' })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: 200,
    description: 'Speaker soft deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Speaker not found' })
  softDelete(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.speakersService.softDelete(id, currentUser.id);
  }
}
