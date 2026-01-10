import {
  IsNotEmpty,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipantType } from '../../common/enums/participant-type.enum';

export class CreateBulkInvitationsDto {
  @ApiProperty({
    description: 'Cantidad de invitaciones a crear',
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  quantity!: number;

  @ApiProperty({
    description: 'Tipo de participante para estas invitaciones',
    enum: ParticipantType,
    example: ParticipantType.STAFF,
  })
  @IsNotEmpty()
  @IsEnum(ParticipantType)
  participantType!: ParticipantType;

  @ApiPropertyOptional({
    description:
      'ID del tipo de ticket a asignar (si no se especifica, se asigna el más barato)',
    example: '66c0da2b6a3aa6ed3c63e010',
  })
  @IsOptional()
  @IsMongoId()
  ticketTypeId?: string;

  @ApiPropertyOptional({
    description: 'Fecha de expiración de las invitaciones (opcional)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
