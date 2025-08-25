import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  Ip,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserRole } from '../common/enums/user-role.enum';
import { QRService } from './qr.service';
import { GenerateQRDto } from './dto/generate-qr.dto';
import { ValidateQRDto } from './dto/validate-qr.dto';
import { QRResponseDto, ValidationResponseDto } from './dto/qr-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { CompanyScopeGuard } from 'src/common/guards/company-scope.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ParseObjectIdPipe } from 'src/common/pipes/parse-object-id.pipe';

@ApiTags('Códigos QR')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('qr')
export class QRController {
  constructor(private readonly qrService: QRService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generar código QR para un ticket',
    description:
      'Genera un código QR dinámico para acceder al evento. Solo el propietario del ticket puede generar su QR.',
  })
  @ApiResponse({
    status: 201,
    description: 'Código QR generado exitosamente',
    type: QRResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o ticket no disponible',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para generar QR de este ticket',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket no encontrado',
  })
  async generateQR(
    @Body() generateQRDto: GenerateQRDto,
    @Request() req: any,
  ): Promise<QRResponseDto> {
    return this.qrService.generateQRCode(generateQRDto, req.user.userId);
  }

  @Post('validate')
  @UseGuards(RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EVENT_STAFF)
  @ApiOperation({
    summary: 'Validar código QR para entrada al evento',
    description:
      'Valida un código QR escaneado y registra el acceso al evento. Solo personal autorizado puede validar.',
  })
  @ApiResponse({
    status: 200,
    description: 'Validación completada (exitosa o fallida)',
    type: ValidationResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para validar códigos QR',
  })
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
  @ApiOperation({
    summary: 'Obtener QR de un ticket específico',
    description:
      'Genera y retorna el código QR para un ticket. Solo el propietario puede acceder a su QR.',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'ID del ticket en formato MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'QR del ticket obtenido exitosamente',
    type: QRResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'ID de ticket con formato inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para acceder a este ticket',
  })
  @ApiResponse({
    status: 404,
    description: 'Ticket no encontrado o eliminado',
  })
  async getTicketQR(
    @Param('ticketId', ParseObjectIdPipe) ticketId: string,
    @Request() req: any,
  ): Promise<QRResponseDto> {
    const generateDto: GenerateQRDto = { ticketId };
    return this.qrService.generateQRCode(generateDto, req.user.userId);
  }

  @Get('validate/history/:ticketId')
  @UseGuards(RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EVENT_STAFF)
  @ApiOperation({
    summary: 'Obtener historial de validaciones de un ticket',
    description:
      'Muestra todas las validaciones (exitosas y fallidas) de un ticket específico.',
  })
  @ApiParam({
    name: 'ticketId',
    description: 'ID del ticket en formato MongoDB ObjectId',
  })
  @ApiResponse({
    status: 200,
    description: 'Historial obtenido exitosamente',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin permisos para ver este historial',
  })
  async getValidationHistory(
    @Param('ticketId', ParseObjectIdPipe) ticketId: string,
  ) {
    return this.qrService.getValidationHistory(ticketId);
  }

  @Get('event/:eventId/stats')
  @UseGuards(RolesGuard, CompanyScopeGuard)
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.EVENT_STAFF)
  @ApiOperation({
    summary: 'Obtener estadísticas de acceso al evento',
    description:
      'Estadísticas de validaciones, entradas exitosas y fallidas del evento.',
  })
  @ApiParam({
    name: 'eventId',
    description: 'ID del evento en formato MongoDB ObjectId',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas obtenidas exitosamente',
  })
  async getEventStats(@Param('eventId', ParseObjectIdPipe) eventId: string) {
    return this.qrService.getEventEntryStats(eventId);
  }
}
