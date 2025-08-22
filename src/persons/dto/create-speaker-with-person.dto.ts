import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsObject,
  Min,
  MaxLength,
  MinLength,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSpeakerWithPersonDto {
  @ApiProperty({
    description: 'Speaker first name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({
    description: 'Speaker last name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @ApiPropertyOptional({ description: 'Speaker email (optional for speakers)' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: 'Speaker company ID' })
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Speaker specialty/expertise area' })
  @IsString()
  specialty: string;

  @ApiPropertyOptional({ description: 'Speaker biography' })
  @IsOptional()
  @IsString()
  biography?: string;

  @ApiProperty({ description: 'Years of experience', minimum: 0 })
  @IsNumber()
  @Min(0)
  yearsExperience: number;

  @ApiPropertyOptional({ description: 'Professional certifications' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certifications?: string[];

  @ApiPropertyOptional({ description: 'Hourly rate', minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ description: 'Speaker availability', default: true })
  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

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

  @ApiPropertyOptional({
    description: 'Social media links',
    example: {
      linkedin: 'https://linkedin.com/in/speaker',
      twitter: '@speaker',
    },
  })
  @IsOptional()
  @IsObject()
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };

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

  @ApiPropertyOptional({
    description: 'Currency for hourly rate',
    enum: ['USD', 'PEN', 'EUR'],
  })
  @IsOptional()
  @IsEnum(['USD', 'PEN', 'EUR'])
  currency?: string;
}
