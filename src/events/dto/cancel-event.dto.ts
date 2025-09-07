import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelEventDto {
  @ApiPropertyOptional({
    description:
      'Motivo de cancelación (recomendado para trazabilidad y comunicación).',
    example:
      'Cancelado por condiciones climáticas adversas que afectan la logística.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
