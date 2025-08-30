import {
  IsString,
  IsEmail,
  IsOptional,
  IsDateString,
  IsEnum,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PersonType } from 'src/common/enums/person-type.enum';
import { Transform } from 'class-transformer';

export class CreatePersonDto {
  @ApiProperty({
    description: 'Nombre de la persona',
    minLength: 2,
    maxLength: 50,
    example: 'Juan',
  })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  @Transform(({ value }) => value?.trim())
  firstName: string;

  @ApiProperty({
    description: 'Apellido de la persona',
    minLength: 2,
    maxLength: 50,
    example: 'Pérez',
  })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  @Transform(({ value }) => value?.trim())
  lastName: string;

  @ApiPropertyOptional({
    description: 'Correo electrónico de la persona',
    example: 'juan.perez@example.com',
    uniqueItems: true,
  })
  @IsOptional()
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono con código de país',
    example: '+51999888777',
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @IsPhoneNumber(undefined, {
    message:
      'El teléfono debe ser válido con código de país (ej: +51999888777)',
  })
  phone?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento (ISO 8601)',
    example: '1990-01-15',
    format: 'date',
  })
  @IsOptional()
  @IsDateString({}, { message: 'La fecha debe estar en formato ISO 8601' })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Type of person',
    example: PersonType.USER_PERSON,
    enum: PersonType,
    default: PersonType.USER_PERSON,
  })
  @IsEnum(PersonType)
  type: PersonType;
}
