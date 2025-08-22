import { IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EntityStatus } from '../enums/entity-status.enum';
import { PaginationDto } from './pagination.dto';

export class BaseFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by entity status',
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(EntityStatus)
  status?: EntityStatus = EntityStatus.ACTIVE;

  @ApiPropertyOptional({ description: 'Filter by creation date from' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by creation date to' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ description: 'Search term for text fields' })
  @IsOptional()
  search?: string;
}
