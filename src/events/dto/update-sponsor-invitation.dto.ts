import {
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSponsorInvitationDto {
  @ApiPropertyOptional({
    description: 'Nuevo número máximo de usos',
    example: 15,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUses?: number;

  @ApiPropertyOptional({
    description: 'Nueva fecha de expiración',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Estado activo de la invitación',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Cambiar tipo de ticket asignado',
    example: '66c0da2b6a3aa6ed3c63e011',
  })
  @IsOptional()
  @IsMongoId()
  ticketTypeId?: string;
}
