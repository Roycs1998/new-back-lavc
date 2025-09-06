import {
  IsOptional,
  IsEnum,
  IsString,
  IsMongoId,
  IsBoolean,
  IsArray,
} from 'class-validator';
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';
import { EventType } from '../../common/enums/event-type.enum';
import { EventStatus } from '../../common/enums/event-status.enum';
import { EventLocationType } from 'src/common/enums/event-location-type.enum';

export class EventFilterDto extends OmitType(BaseFilterDto, [
  'entityStatus',
] as const) {
  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ description: 'Filtra por empresa' })
  companyId?: string;

  @IsOptional()
  @IsEnum(EventType)
  @ApiPropertyOptional({ description: 'Tipo de evento' })
  type?: EventType;

  @IsOptional()
  @IsEnum(EventStatus)
  @ApiPropertyOptional({ description: 'Estado del evento' })
  eventStatus?: EventStatus;

  @IsOptional()
  @IsEnum(EventLocationType)
  @ApiPropertyOptional({ description: 'Tipo de localización' })
  locationType?: EventLocationType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Ciudad (para eventos físicos/híbridos)',
  })
  city?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'País (para eventos físicos/híbridos)' })
  country?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Rango: fecha de inicio desde (ISO)' })
  startFrom?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Rango: fecha de inicio hasta (ISO)' })
  startTo?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Rango: fecha de fin desde (ISO)' })
  endFrom?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Rango: fecha de fin hasta (ISO)' })
  endTo?: string;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ description: 'Tags (match ANY)' })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ description: 'Categorías (match ANY)' })
  categories?: string[];

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({
    description: 'Eventos donde participa un speaker específico',
  })
  speakerId?: string;

  @ApiPropertyOptional({
    description: 'Include only events with available tickets',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean()
  hasAvailableTickets?: boolean;

  @ApiPropertyOptional({ description: 'Filter by minimum price' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Filter by maximum price' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  maxPrice?: number;
}
