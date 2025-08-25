import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  RawBody,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { RefundReason } from '../common/enums/refund-reason.enum';

@ApiTags('Payments')
@Controller('payments')
@ApiBearerAuth('JWT-auth')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Process payment for order' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  @ApiResponse({ status: 400, description: 'Payment failed or invalid data' })
  processPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    return this.paymentsService.processPayment(createPaymentDto);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({
    status: 200,
    description: 'Payment history retrieved successfully',
  })
  getPaymentHistory(@CurrentUser() currentUser: CurrentUserData) {
    return this.paymentsService.getPaymentHistory(currentUser.id);
  }

  @Get('transactions/:transactionId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get transaction details' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  getTransaction(@Param('transactionId') transactionId: string) {
    return this.paymentsService.getTransaction(transactionId);
  }

  @Post('transactions/:transactionId/refund')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN)
  @ApiOperation({ summary: 'Process refund (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiResponse({ status: 400, description: 'Refund failed or invalid request' })
  processRefund(
    @Param('transactionId') transactionId: string,
    @Body('amount') amount?: number,
    @Body('reason') reason?: RefundReason,
  ) {
    return this.paymentsService.refundPayment(transactionId, amount, reason);
  }

  @Post('webhooks/culqi')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Culqi webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  handleCulqiWebhook(
    @Body() payload: any,
    @Headers('culqi-signature') signature?: string,
  ) {
    return this.paymentsService.handleWebhook('culqi', payload, signature);
  }
}
