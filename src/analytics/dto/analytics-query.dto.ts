import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum, IsMongoId } from 'class-validator';
import { AnalyticsMetric } from 'src/common/enums/analytics-metric.enum';
import { TimeRange } from 'src/common/enums/time-range.enum';

export class AnalyticsQueryDto {
  @ApiPropertyOptional({ enum: TimeRange })
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.LAST_30_DAYS;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @ApiPropertyOptional({ enum: AnalyticsMetric, isArray: true })
  @IsOptional()
  @IsEnum(AnalyticsMetric, { each: true })
  metrics?: AnalyticsMetric[];
}
