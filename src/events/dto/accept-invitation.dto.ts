import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptInvitationDto {
  @ApiPropertyOptional({
    description: 'Email para nuevo usuario (requerido si no hay sesión activa)',
    example: 'nuevo@example.com',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    description:
      'Nombre para nuevo usuario (requerido si no hay sesión activa)',
    example: 'Juan',
  })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({
    description:
      'Apellido para nuevo usuario (requerido si no hay sesión activa)',
    example: 'Pérez',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({
    description:
      'Contraseña para nuevo usuario (requerido si no hay sesión activa)',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({
    description: 'Teléfono del nuevo usuario (opcional)',
    example: '+51999888777',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}
