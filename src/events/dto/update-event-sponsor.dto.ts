import { IsNumber, Min, IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateEventSponsorDto {
  @ApiPropertyOptional({
    description: 'Nueva cuota de miembros del staff',
    example: 15,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  staffQuota?: number;

  @ApiPropertyOptional({
    description: 'Nueva cuota de invitados',
    example: 60,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  guestQuota?: number;

  @ApiPropertyOptional({
    description: 'Nueva cuota de becas',
    example: 10,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  scholarshipQuota?: number;

  @ApiPropertyOptional({
    description: 'Estado activo del patrocinador',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
