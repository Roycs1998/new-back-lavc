import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { Currency } from '../../common/enums/currency.enum';

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

export class CreateSpeakerWithUserDto extends CreateUserDto {
  @ApiProperty({
    description: 'Especialidad o área de expertise del expositor',
    example: 'Cardiología veterinaria',
  })
  @IsOptional()
  @IsString({ message: 'La especialidad debe ser texto' })
  @Transform(({ value }) => value?.trim())
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Biografía del expositor',
    example: 'Conferencista internacional con más de 10 años de experiencia...',
  })
  @IsOptional()
  @IsString({ message: 'La biografía debe ser texto' })
  @Transform(({ value }) => value?.trim())
  biography?: string;

  @ApiProperty({
    description: 'Años de experiencia',
    minimum: 0,
    example: 5,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Los años de experiencia deben ser numéricos' })
  @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
  yearsExperience?: number;

  @ApiPropertyOptional({
    description: 'Certificaciones profesionales',
    example: [
      'Diplomado en cirugía',
      'Certificación internacional en anestesia',
    ],
  })
  @IsOptional()
  @IsArray({ message: 'Las certificaciones deben ser un arreglo de strings' })
  @IsString({ each: true, message: 'Cada certificación debe ser texto' })
  certifications?: string[];

  @ApiPropertyOptional({
    description: 'Tarifa por hora',
    example: 150,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Moneda de la tarifa',
    enum: Currency,
    example: Currency.USD,
  })
  @IsOptional()
  currency?: Currency;

  @ApiPropertyOptional({ type: SocialMediaCreateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaCreateDto)
  socialMedia?: SocialMediaCreateDto;

  @ApiPropertyOptional({
    description: 'Idiomas que domina',
    example: ['Español', 'Inglés'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Temas de interés',
    example: ['Cardiología', 'Cirugía'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  topics?: string[];

  @ApiPropertyOptional({ type: AudienceSizeCreateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AudienceSizeCreateDto)
  audienceSize?: AudienceSizeCreateDto;

  @ApiPropertyOptional({
    description: 'Notas internas',
    example: 'Disponible solo fines de semana',
  })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  notes?: string;
}
