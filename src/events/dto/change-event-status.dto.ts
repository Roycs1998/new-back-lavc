import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EventStatus } from 'src/common/enums/event-status.enum';

export class ChangeEventStatusDto {
  @ApiProperty({
    enum: EventStatus,
    description: 'Nuevo estado del evento',
    example: EventStatus.APPROVED,
    enumName: 'EventStatus',
  })
  @IsEnum(EventStatus)
  eventStatus!: EventStatus;

  @ApiPropertyOptional({
    description:
      'Motivo de rechazo (obligatorio cuando eventStatus = REJECTED)',
    example: 'Contenido no acorde con las políticas.',
  })
  @ValidateIf((o) => o.eventStatus === EventStatus.REJECTED)
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  rejectionReason?: string;

  @ValidateIf((o) => o.eventStatus !== EventStatus.REJECTED)
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  // Permite enviarlo vacío o no enviarlo al aprobar, pero lo ignoraremos en el servicio
  private _ignoreWhenNotRejected?: string;
}
