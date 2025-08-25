import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  Min,
  IsEnum,
  IsNotEmpty,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePersonDto } from './create-person.dto';
import { Transform } from 'class-transformer';
import { CurrencyCode } from 'src/common/enums/currency.enum';

export class CreateSpeakerWithPersonDto extends CreatePersonDto {
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
  @IsNotEmpty({ message: 'La especialidad es requerida' })
  @IsString({ message: 'La especialidad debe ser texto' })
  @Transform(({ value }) => value?.trim())
  specialty: string;

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
  @IsNumber({}, { message: 'Los años de experiencia deben ser numéricos' })
  @Min(0, { message: 'Los años de experiencia no pueden ser negativos' })
  yearsExperience: number;

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

  @ApiPropertyOptional({
    description: 'Enlaces a redes sociales',
    example: {
      linkedin: 'https://linkedin.com/in/speaker',
      twitter: '@speaker',
      website: 'https://speaker.com',
    },
  })
  @IsOptional()
  @IsObject({ message: 'Las redes sociales deben ser un objeto' })
  socialMedia?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };

  @ApiPropertyOptional({
    description: 'Rango de tamaño de audiencia preferida',
    example: { min: 20, max: 200 },
  })
  @IsOptional()
  @IsObject({ message: 'El tamaño de audiencia debe ser un objeto' })
  audienceSize?: {
    min?: number;
    max?: number;
  };

  @ApiPropertyOptional({
    description: 'Notas adicionales sobre el expositor',
    example: 'Requiere proyector para todas sus presentaciones.',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser texto' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Moneda para la tarifa por hora',
    enum: CurrencyCode,
    example: CurrencyCode.USD,
  })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: CurrencyCode;
}
