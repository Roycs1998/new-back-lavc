import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Ip,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { UserRole } from '../common/enums/user-role.enum';
import { QRService } from './qr.service';
import { GenerateQRDto } from './dto/generate-qr.dto';
import { ValidateQRDto } from './dto/validate-qr.dto';
import { QRResponseDto, ValidationResponseDto } from './dto/qr-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyScopeGuard } from 'src/common/guards/company-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';

@ApiTags('QR Codes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('qr')
export class QRController {
  constructor(private readonly qrService: QRService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generar código QR para un ticket (dinámico - no se guarda en BD)',
  })
  @ApiResponse({ status: 201, type: QRResponseDto })
  async generateQR(
    @Body() generateQRDto: GenerateQRDto,
    @Request() req: any,
  ): Promise<QRResponseDto> {
    return this.qrService.generateQRCode(generateQRDto, req.user.userId);
  }

  @Post('validate')
  @UseGuards(RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EVENT_STAFF)
  @ApiOperation({ summary: 'Validar código QR para entrada al evento' })
  @ApiResponse({ status: 200, type: ValidationResponseDto })
  async validateQR(
    @Body() validateQRDto: ValidateQRDto,
    @Request() req: any,
    @Ip() ipAddress: string,
  ): Promise<ValidationResponseDto> {
    return this.qrService.validateQRCode(
      validateQRDto,
      req.user.userId,
      ipAddress,
    );
  }

  @Get('ticket/:ticketId')
  @ApiOperation({ summary: 'Generar QR para un ticket específico' })
  @ApiParam({ name: 'ticketId', description: 'ID del ticket' })
  @ApiResponse({ status: 200, type: QRResponseDto })
  async getTicketQR(
    @Param('ticketId') ticketId: string,
    @Request() req: any,
  ): Promise<QRResponseDto> {
    return this.qrService.generateQRCode(
      { ticketId: new Types.ObjectId(ticketId) },
      req.user.userId,
    );
  }

  @Get('events/:eventId/stats')
  @UseGuards(RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EVENT_STAFF)
  @ApiOperation({ summary: 'Estadísticas de entrada por evento' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  async getEventEntryStats(@Param('eventId') eventId: string) {
    return this.qrService.getEventEntryStats(new Types.ObjectId(eventId));
  }

  @Get('events/:eventId/logs')
  @UseGuards(RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EVENT_STAFF)
  @ApiOperation({ summary: 'Ver logs de entrada de un evento' })
  @ApiParam({ name: 'eventId', description: 'ID del evento' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Límite de registros',
  })
  async getEventEntryLogs(
    @Param('eventId') eventId: string,
    @Query('limit') limit?: number,
  ) {
    return this.qrService.getEventEntryLogs(
      new Types.ObjectId(eventId),
      limit || 50,
    );
  }
}
