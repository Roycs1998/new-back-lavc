import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  IsEnum,
  IsMongoId,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { CreatePersonDto } from './create-person.dto';
import { Type } from 'class-transformer';
import { Currency } from 'src/common/enums/currency.enum';

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

export class CreateSpeakerWithPersonDto extends OmitType(CreatePersonDto, [
  'type',
]) {
  @ApiProperty({
    description: 'ID de la empresa del expositor',
    example: '64f14b1a2c4e5a1234567890',
  })
  @IsMongoId({ message: 'El ID de la empresa debe ser un ObjectId válido' })
  companyId: string;

  @ApiProperty({
    description: 'Especialidad o área de expertise del expositor',
    example: 'Cardiología veterinaria',
  })
  @IsOptional()
  @IsString({ message: 'La especialidad debe ser texto' })
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Biografía del expositor',
    example: 'Conferencista internacional con más de 10 años de experiencia...',
  })
  @IsOptional()
  @IsString({ message: 'La biografía debe ser texto' })
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
    description: 'Tarifa por hora (en números)',
    minimum: 0,
    example: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'La tarifa debe ser un número' })
  @Min(0, { message: 'La tarifa no puede ser negativa' })
  hourlyRate?: number;

  @ApiPropertyOptional({
    description: 'Idiomas en los que el expositor puede presentar',
    example: ['Español', 'Inglés'],
  })
  @IsOptional()
  @IsArray({ message: 'Los idiomas deben ser un arreglo de strings' })
  @IsString({ each: true, message: 'Cada idioma debe ser texto' })
  languages?: string[];

  @ApiPropertyOptional({
    description: 'Temas que el expositor puede cubrir',
    example: ['Medicina preventiva', 'Nutrición animal'],
  })
  @IsOptional()
  @IsArray({ message: 'Los temas deben ser un arreglo de strings' })
  @IsString({ each: true, message: 'Cada tema debe ser texto' })
  topics?: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => SocialMediaCreateDto)
  @ApiPropertyOptional({
    description: 'Enlaces a redes sociales',
    example: SocialMediaCreateDto,
  })
  socialMedia?: SocialMediaCreateDto;

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
  @IsEnum(Currency)
  @ApiPropertyOptional({ enum: Currency, example: Currency.PEN })
  currency?: Currency;
}
