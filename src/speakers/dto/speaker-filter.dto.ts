import {
  IsOptional,
  IsEnum,
  IsString,
  IsMongoId,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';

export class SpeakerFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by specialty' })
  @IsOptional()
  @IsString()
  specialty?: string;

  @ApiPropertyOptional({ description: 'Minimum years of experience' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Min(0)
  minExperience?: number;

  @ApiPropertyOptional({ description: 'Maximum years of experience' })
  @IsOptional()
  @Transform(({ value }) => (value !== undefined ? Number(value) : undefined))
  @IsNumber()
  @Max(50)
  maxExperience?: number;

  @ApiPropertyOptional({ description: 'Filter by language' })
  @IsOptional()
  @IsString()
  language?: string;

  @ApiPropertyOptional({ description: 'Filter by topic' })
  @IsOptional()
  @IsString()
  topic?: string;

  @ApiPropertyOptional({ description: 'Filter by currency' })
  @IsOptional()
  @IsEnum(['USD', 'PEN', 'EUR'])
  currency?: string;

  @ApiPropertyOptional({ description: 'Minimum hourly rate' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0)
  minRate?: number;

  @ApiPropertyOptional({ description: 'Maximum hourly rate' })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Max(10000)
  maxRate?: number;

  @ApiPropertyOptional({ description: 'Filter by upload method' })
  @IsOptional()
  @IsEnum(['manual', 'excel', 'csv', 'bulk_import'])
  uploadedVia?: string;
}
