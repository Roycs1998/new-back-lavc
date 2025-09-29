import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsMongoId,
  Min,
  Max,
  IsEnum,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from 'src/common/enums/currency.enum';
import { Type } from 'class-transformer';
import { UploadSource } from '../entities/speaker.entity';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

class SocialMediaCreateDto {
  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/jdoe' })
  linkedin?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://twitter.com/jdoe' })
  twitter?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://jdoe.dev' })
  website?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://github.com/jdoe' })
  github?: string;
}

class AudienceSizeCreateDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 50, minimum: 0 })
  min?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 300, minimum: 0 })
  max?: number;
}

export class CreateSpeakerDto {
  @IsMongoId()
  @ApiProperty({ example: '66a9d8f7a2a0b7b3e1b0d111' })
  personId: string;

  @IsMongoId()
  @ApiProperty({ example: '66a9d8f7a2a0b7b3e1b0d222' })
  companyId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Gastroenterología' })
  specialty?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'Especialista en hígado graso (NAFLD/NASH).',
  })
  biography?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(50)
  @ApiProperty({ example: 8, minimum: 0, maximum: 50 })
  yearsExperience?: number;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ type: [String], example: ['ACLS', 'BLS'] })
  certifications?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  @ApiPropertyOptional({ example: 120 })
  hourlyRate?: number;

  @IsOptional()
  @IsEnum(Currency)
  @ApiPropertyOptional({ enum: Currency, example: Currency.PEN })
  currency?: Currency;

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaCreateDto)
  @ApiPropertyOptional({ type: SocialMediaCreateDto })
  socialMedia?: SocialMediaCreateDto;

  @IsOptional()
  @IsEnum(UploadSource)
  @ApiPropertyOptional({ enum: UploadSource, example: UploadSource.MANUAL })
  uploadedVia?: UploadSource;

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({ type: [String], example: ['es', 'en'] })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({
    type: [String],
    example: ['hepatología', 'hígado graso'],
  })
  topics?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceSizeCreateDto)
  @ApiPropertyOptional({ type: AudienceSizeCreateDto })
  audienceSize?: AudienceSizeCreateDto;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Notas internas del speaker' })
  notes?: string;

  @IsOptional()
  @IsEnum(EntityStatus)
  @ApiPropertyOptional({ enum: EntityStatus, example: EntityStatus.ACTIVE })
  entityStatus?: EntityStatus;
}
