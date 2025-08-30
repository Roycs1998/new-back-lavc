import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiPropertyOptional({
    description: 'Token utilizado para restablecer la contraseña del usuario',
    example: 'prt_0b3c96bd1a7a4e6db3e2f1f1a3c2',
  })
  @IsOptional()
  @IsString({
    message: 'El token de restablecimiento de contraseña debe ser texto',
  })
  passwordResetToken?: string;

  @ApiPropertyOptional({
    description:
      'Token opaco utilizado para verificar el correo electrónico del usuario',
    example: 'evt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString({ message: 'El token de verificación debe ser texto' })
  emailVerificationToken?: string;

  @ApiPropertyOptional({
    description:
      'Fecha de expiración del token de restablecimiento de contraseña (ISO 8601)',
    example: '2025-09-01T12:00:00.000Z',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'La fecha de expiración debe estar en formato ISO 8601' },
  )
  passwordResetExpires?: Date;
}
