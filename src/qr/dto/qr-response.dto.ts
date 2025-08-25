import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EntryStatus } from '../../common/enums/entry-status.enum';

export class TicketInfoDto {
  @ApiProperty({ description: 'ID del ticket' })
  id: string;

  @ApiProperty({ description: 'Número único del ticket' })
  ticketNumber: string;

  @ApiProperty({ description: 'Título del evento' })
  eventTitle: string;

  @ApiProperty({ description: 'Fecha y hora del evento' })
  eventDate: Date;

  @ApiProperty({ description: 'Nombre completo del asistente' })
  attendeeName: string;

  @ApiProperty({ description: 'Tipo de ticket' })
  ticketType: string;

  @ApiProperty({ description: 'Precio pagado por el ticket' })
  price: number;

  @ApiPropertyOptional({ description: 'Número de asiento (si aplica)' })
  seatNumber?: string;

  @ApiPropertyOptional({ description: 'Si el ticket ya fue usado' })
  alreadyUsed?: boolean;
}

export class QRResponseDto {
  @ApiProperty({
    description: 'Código QR firmado (string)',
    example: 'eyJ0aWNrZXRJZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSJ9.signature',
  })
  qrCode: string;

  @ApiProperty({
    description: 'Código QR como imagen base64 data URL',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
  })
  qrDataUrl: string;

  @ApiProperty({
    description: 'Información del ticket asociado al QR',
    type: TicketInfoDto,
  })
  ticketInfo: TicketInfoDto;

  @ApiProperty({ description: 'Timestamp de cuando se generó el QR' })
  generatedAt: Date;
}

export class ValidationResponseDto {
  @ApiProperty({
    enum: EntryStatus,
    description: 'Estado de la validación',
    example: EntryStatus.ALLOWED,
  })
  status: EntryStatus;

  @ApiProperty({
    description: 'Mensaje explicativo del resultado',
    example: 'Entrada permitida. Bienvenido al evento.',
  })
  message: string;

  @ApiProperty({
    description: 'Si el ticket es válido para ingresar',
    example: true,
  })
  isValid: boolean;

  @ApiPropertyOptional({
    description: 'Información del ticket validado',
    type: TicketInfoDto,
  })
  ticketInfo?: TicketInfoDto;

  @ApiProperty({ description: 'Timestamp de la validación' })
  validatedAt: Date;

  @ApiPropertyOptional({ description: 'ID del usuario que validó' })
  validatedBy?: string;

  @ApiPropertyOptional({
    description: 'Información adicional de la validación',
  })
  metadata?: {
    ipAddress?: string;
    deviceInfo?: string; // STRING como en tu schema
    location?: {
      latitude: number;
      longitude: number;
    };
    retryCount?: number;
  };
}
