import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsObject,
  IsMongoId,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeakerDto {
  @ApiProperty({ description: 'Person ID reference' })
  @IsMongoId()
  personId: string;

  @ApiProperty({ description: 'Company ID reference' })
  @IsMongoId()
  companyId: string;

  @ApiProperty({ description: 'Speaker specialty/expertise area' })
  @IsString()
  specialty: string;

  @ApiPropertyOptional({ description: 'Speaker biography' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ description: 'Years of experience', minimum: 0, maximum: 50 })
  @IsNumber()
  @Min(0)
  @Max(50)
  yearsExperience: number;

  @ApiPropertyOptional({ description: 'Professional certifications' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({
    description: 'Hourly rate',
    minimum: 0,
    maximum: 10000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10000)
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Currency for hourly rate',
    enum: ['USD', 'PEN', 'EUR'],
  })
  @IsOptional()
  @IsEnum(['USD', 'PEN', 'EUR'])
  currency?: string;

  @ApiPropertyOptional({ description: 'Speaker availability', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({ description: 'Social media links' })
  @IsOptional()
  @IsObject()
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
    github?: string;
  };

  @ApiPropertyOptional({ description: 'Languages speaker can present in' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({ description: 'Topics speaker can cover' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @ApiPropertyOptional({ description: 'Preferred audience size range' })
  @IsOptional()
  @IsObject()
  audienceSize?: {
    min?: number;
    max?: number;
  };

  @ApiPropertyOptional({ description: 'Additional notes about speaker' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'How speaker was uploaded' })
  @IsOptional()
  @IsString()
  uploadedVia?: string;
}
