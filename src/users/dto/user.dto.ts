import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { UserRole } from 'src/common/enums/user-role.enum';

class ShortCompanyDto {
  @ApiProperty({
    description: 'ID único de la empresa',
    example: '64f14b1a2c4e5a1234567891',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Acme Corp',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Correo de contacto de la empresa',
    example: 'contact@acme.com',
  })
  @Expose()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto de la empresa',
    example: '+51999999999',
  })
  @Expose()
  contactPhone?: string;
}

class ShortPersonDto {
  @ApiProperty({
    description: 'ID único de la persona',
    example: '64f14b1a2c4e5a1234567890',
  })
  @Expose()
  @Transform(({ obj }) => obj._id?.toString())
  id: string;

  @ApiProperty({
    description: 'Nombre de la persona',
    example: 'Juan',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Apellido de la persona',
    example: 'Pérez',
  })
  @Expose()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+51987654321',
  })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo de la persona (campo virtual)',
    example: 'Juan Pérez',
  })
  @Expose()
  fullName?: string;
}

export class UserDto {
  @ApiProperty({
    description: 'ID único del usuario',
    example: '64f14b1a2c4e5a1234567890',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Correo electrónico del usuario',
    example: 'usuario@example.com',
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: 'Rol del usuario dentro de la plataforma',
    enum: UserRole,
    example: UserRole.USER,
  })
  @Expose()
  role: UserRole;

  @ApiPropertyOptional({
    description: 'Empresa asociada al usuario',
    example: ShortCompanyDto,
  })
  @Type(() => ShortCompanyDto)
  @Expose()
  company?: ShortCompanyDto;

  @ApiProperty({
    description: 'Indica si el correo electrónico fue verificado',
    example: true,
  })
  @Expose()
  emailVerified: boolean;

  @ApiPropertyOptional({
    description: 'Última fecha de inicio de sesión',
    example: '2025-08-25T10:15:30.000Z',
  })
  @Expose()
  lastLogin?: Date;

  @ApiProperty({
    description: 'Estado actual de la entidad',
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
  })
  @Expose()
  entityStatus: EntityStatus;

  @ApiProperty({
    description: 'Fecha de creación del usuario',
    example: '2025-08-25T10:15:30.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del usuario',
    example: '2025-08-25T12:20:00.000Z',
  })
  @Expose()
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Fecha de eliminación lógica (si fue eliminada)',
    example: '2025-08-25T15:00:00.000Z',
  })
  @Expose()
  deletedAt?: Date;

  @ApiPropertyOptional({
    description: 'Persona asociada al usuario',
    type: () => ShortPersonDto,
  })
  @Expose()
  @Type(() => ShortPersonDto)
  person?: ShortPersonDto;
}
