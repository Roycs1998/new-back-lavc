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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentMethodsService } from './payment-methods.service';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodFilterDto } from './dto/payment-method-filter.dto';
import { PaymentMethodDto } from './dto/payment-method.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { UserRole } from 'src/common/enums/user-role.enum';
import { toDto } from 'src/utils/toDto';

@ApiTags('Payment Methods')
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly service: PaymentMethodsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create payment method' })
  @ApiResponse({
    status: 201,
    description: 'Payment method created',
    type: PaymentMethodDto,
  })
  async create(
    @Body() createDto: CreatePaymentMethodDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.service.create(createDto, user._id);
    return toDto(result, PaymentMethodDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all payment methods (admin)' })
  @ApiResponse({
    status: 200,
    description: 'List of payment methods',
    type: [PaymentMethodDto],
  })
  async findAll(@Query() filter: PaymentMethodFilterDto) {
    const results = await this.service.findAll(filter);
    return results.map((r) => toDto(r, PaymentMethodDto));
  }

  @Get('available')
  @Public()
  @ApiOperation({ summary: 'Get available payment methods (public + company)' })
  @ApiResponse({
    status: 200,
    description: 'Available payment methods',
    type: [PaymentMethodDto],
  })
  async getAvailablePaymentMethods(
    @Query('companyId') companyId?: string,
    @Query('eventId') eventId?: string,
  ) {
    const results = await this.service.getAvailablePaymentMethods(
      companyId,
      eventId,
    );
    return results.map((r) => toDto(r, PaymentMethodDto));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment method by ID' })
  @ApiResponse({
    status: 200,
    description: 'Payment method details',
    type: PaymentMethodDto,
  })
  async findOne(@Param('id') id: string) {
    const result = await this.service.findOne(id);
    return toDto(result, PaymentMethodDto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update payment method' })
  @ApiResponse({
    status: 200,
    description: 'Payment method updated',
    type: PaymentMethodDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentMethodDto,
    @CurrentUser() user: any,
  ) {
    const result = await this.service.update(id, updateDto, user._id);
    return toDto(result, PaymentMethodDto);
  }

  @Patch(':id/toggle-active')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Toggle payment method active status' })
  @ApiResponse({
    status: 200,
    description: 'Status toggled',
    type: PaymentMethodDto,
  })
  async toggleActive(@Param('id') id: string) {
    const result = await this.service.toggleActive(id);
    return toDto(result, PaymentMethodDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Soft delete payment method' })
  @ApiResponse({ status: 200, description: 'Payment method deleted' })
  async softDelete(@Param('id') id: string, @CurrentUser() user: any) {
    return this.service.softDelete(id, user._id);
  }
}
