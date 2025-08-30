import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsMongoId,
  MinLength,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { UserRole } from 'src/common/enums/user-role.enum';
import { Transform } from 'class-transformer';
import { CreatePersonDto } from './create-person.dto';

export class CreateUserWithPersonDto extends OmitType(CreatePersonDto, [
  'email',
  'type',
]) {
  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'juan.perez@example.com',
  })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  @Transform(({ value }) => value?.toLowerCase().trim())
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
    description: 'Rol del usuario',
    enum: UserRole,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol no es válido' })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'ID de la empresa (requerido para administradores de empresa)',
    example: '64f14b1a2c4e5a1234567890',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID de la empresa debe ser un ObjectId válido' })
  companyId?: string;
}
