import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
} from 'class-validator';
import { QuotaRequestStatus } from '../entities/sponsor-quota-request.entity';

export class ReviewQuotaRequestDto {
  @ApiProperty({
    enum: [QuotaRequestStatus.APPROVED, QuotaRequestStatus.REJECTED],
    description: 'Estado de la revisión',
    example: QuotaRequestStatus.APPROVED,
  })
  @IsEnum(QuotaRequestStatus)
  @IsNotEmpty()
  status!: QuotaRequestStatus;

  @ApiProperty({
    description:
      'Cantidad aprobada (si es diferente a la solicitada). Requerido si el estado es APPROVED.',
    example: 5,
    required: false,
  })
  @ValidateIf((o) => o.status === QuotaRequestStatus.APPROVED)
  @IsInt()
  @IsPositive()
  @IsOptional()
  approvedAmount?: number;

  @ApiProperty({
    description: 'Motivo del rechazo. Requerido si el estado es REJECTED.',
    example: 'No hay suficiente capacidad en el recinto.',
    required: false,
  })
  @ValidateIf((o) => o.status === QuotaRequestStatus.REJECTED)
  @IsString()
  @IsNotEmpty()
  rejectionReason?: string;
}
