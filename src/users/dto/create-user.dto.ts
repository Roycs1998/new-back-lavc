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
  IsArray,
  IsMongoId,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { UserRole } from 'src/common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nombre del usuario',
    minLength: 2,
    maxLength: 50,
    example: 'Juan',
  })
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser texto' })
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El nombre no puede exceder 50 caracteres' })
  @Transform(({ value }: { value: string }) => value.trim())
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    minLength: 2,
    maxLength: 50,
    example: 'Pérez',
  })
  @IsNotEmpty({ message: 'El apellido es requerido' })
  @IsString({ message: 'El apellido debe ser texto' })
  @MinLength(2, { message: 'El apellido debe tener al menos 2 caracteres' })
  @MaxLength(50, { message: 'El apellido no puede exceder 50 caracteres' })
  @Transform(({ value }: { value: string }) => value.trim())
  lastName: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@example.com',
  })
  @IsNotEmpty({ message: 'El email es requerido' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @Transform(({ value }: { value: string }) => value.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    minLength: 8,
    example: 'Secr3tPass!',
  })
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @IsString({ message: 'La contraseña debe ser texto' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

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

  @ApiPropertyOptional({
    description: 'URL del avatar/foto del usuario',
    example: 'upload/users/123456-uuid-photo.jpg',
  })
  @IsOptional()
  @IsString({ message: 'El avatar debe ser texto' })
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario',
    enum: UserRole,
    isArray: true,
    default: [UserRole.USER],
  })
  @IsOptional()
  @IsEnum(UserRole, { each: true, message: 'El rol no es válido' })
  @IsArray({ message: 'El rol debe ser una lista' })
  roles?: UserRole[];

  @ApiPropertyOptional({
    description:
      'IDs de las empresas (requerido para administradores de empresa)',
    example: ['64f14b1a2c4e5a1234567890'],
  })
  @IsOptional()
  @IsArray({ message: 'Los IDs de las empresas deben ser una lista' })
  @IsMongoId({
    each: true,
    message: 'Cada ID de empresa debe ser un ObjectId válido',
  })
  companyIds?: string[];
}
