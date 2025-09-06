import {
  IsOptional,
  IsEnum,
  IsString,
  IsMongoId,
  IsNumber,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';
import { Currency } from 'src/common/enums/currency.enum';
import { UploadSource } from '../entities/speaker.entity';

export class SpeakerFilterDto extends BaseFilterDto {
  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional()
  companyId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Match exacto (case-insensitive)',
  })
  specialty?: string;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ type: [String] })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({
    type: [String],
  })
  topics?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({})
  minYears?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({})
  maxYears?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({})
  minRate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({})
  maxRate?: number;

  @IsOptional()
  @IsEnum(Currency)
  @ApiPropertyOptional({ enum: Currency })
  currency?: Currency;

  @IsOptional()
  @IsEnum(UploadSource)
  @ApiPropertyOptional({ enum: UploadSource })
  uploadedVia?: UploadSource;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Si true, incluye registros con deletedAt',
  })
  includeDeleted?: boolean;
}
