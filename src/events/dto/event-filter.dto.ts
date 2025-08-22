import {
  IsOptional,
  IsEnum,
  IsString,
  IsMongoId,
  IsBoolean,
  IsDateString,
} from 'class-validator';
import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';
import { EventType } from '../../common/enums/event-type.enum';
import { EventStatus } from '../../common/enums/event-status.enum';

export class EventFilterDto extends OmitType(BaseFilterDto, [
  'status',
] as const) {
  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by event type', enum: EventType })
  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @ApiPropertyOptional({
    description: 'Filter by event status',
    enum: EventStatus,
  })
  @IsOptional()
  @IsEnum(EventStatus)
  eventStatus?: EventStatus;

  @ApiPropertyOptional({ description: 'Filter by location type' })
  @IsOptional()
  @IsEnum(['physical', 'virtual', 'hybrid'])
  locationType?: 'physical' | 'virtual' | 'hybrid';

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ description: 'Filter events from date' })
  @IsOptional()
  @IsDateString()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter events to date' })
  @IsOptional()
  @IsDateString()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter events to date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Filter by category' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filter by tag' })
  @IsOptional()
  @IsString()
  tag?: string;

  @ApiPropertyOptional({ description: 'Filter by speaker ID' })
  @IsOptional()
  @IsMongoId()
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
