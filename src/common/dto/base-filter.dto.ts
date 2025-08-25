import { IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '../enums/entity-status.enum';
import { PaginationDto } from './pagination.dto';

export class BaseFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado de la entidad',
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EntityStatus, {
    message: 'El estado de la entidad no es válido',
  })
  entityStatus?: EntityStatus = EntityStatus.ACTIVE;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de creación (desde)',
    example: '2024-01-01',
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha inicial debe tener formato ISO 8601 (YYYY-MM-DD)' },
  )
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por fecha de creación (hasta)',
    example: '2024-12-31',
    format: 'date',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha final debe tener formato ISO 8601 (YYYY-MM-DD)' },
  )
  createdTo?: string;

  @ApiPropertyOptional({
    description: 'Término de búsqueda aplicado a campos de texto',
    example: 'juan',
  })
  @IsOptional()
  @IsString({ message: 'El parámetro de búsqueda debe ser texto' })
  search?: string;
}
