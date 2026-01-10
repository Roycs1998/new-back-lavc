import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { PersonType } from 'src/common/enums/person-type.enum';

export class PersonDto {
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
    description: 'Correo electrónico de la persona',
    example: 'juan.perez@example.com',
  })
  @Expose()
  email?: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+51987654321',
  })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Fecha de nacimiento en formato ISO 8601',
    example: '1990-05-12',
  })
  @Expose()
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'Tipo de persona',
    enum: PersonType,
    example: PersonType.USER_PERSON,
  })
  @Expose()
  type: PersonType;

  @ApiProperty({
    description: 'Estado de la entidad',
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
  })
  @Expose()
  entityStatus: EntityStatus;

  @ApiPropertyOptional({
    description: 'Fecha de creación',
    example: '2025-08-25T10:15:30.000Z',
  })
  @Expose()
  createdAt?: Date;

  @ApiPropertyOptional({
    description: 'URL del avatar/foto de la persona',
    example: 'https://cdn.ejemplo.com/upload/speakers/123456-uuid-photo.jpg',
  })
  @Expose()
  avatar?: string;

  @ApiPropertyOptional({
    description: 'Última fecha de actualización',
    example: '2025-08-25T11:20:00.000Z',
  })
  @Expose()
  updatedAt?: Date;

  @ApiPropertyOptional({
    description: 'Nombre completo de la persona (campo virtual)',
    example: 'Juan Pérez',
  })
  @Expose()
  fullName?: string;
}
