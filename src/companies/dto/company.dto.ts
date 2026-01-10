import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { CompanyType } from 'src/common/enums/company-type.enum';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

class AddressDto {
  @ApiPropertyOptional({
    description: 'Calle o avenida',
    example: 'Av. Arequipa 1234',
  })
  @Expose()
  street?: string;

  @ApiProperty({ description: 'Ciudad', example: 'Lima' })
  @Expose()
  city!: string;

  @ApiPropertyOptional({
    description: 'Región/Provincia/Estado',
    example: 'Lima',
  })
  @Expose()
  state?: string;

  @ApiProperty({ description: 'País', example: 'Perú' })
  @Expose()
  country!: string;

  @ApiPropertyOptional({ description: 'Código postal', example: '15046' })
  @Expose()
  zipCode?: string;
}

class CompanySettingsDto {
  @ApiPropertyOptional({
    description: 'Permite subir ponentes (speakers) a la plataforma',
    example: true,
  })
  @Expose()
  canUploadSpeakers?: boolean;

  @ApiPropertyOptional({
    description: 'Permite crear eventos dentro de la plataforma',
    example: true,
  })
  @Expose()
  canCreateEvents?: boolean;

  @ApiPropertyOptional({
    description: 'Número máximo de eventos que la empresa puede crear por mes',
    example: 10,
  })
  @Expose()
  maxEventsPerMonth?: number;
}

export class CompanyDto {
  @ApiProperty({
    description: 'ID único de la empresa',
    example: '64f14b1a2c4e5a1234567891',
  })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Nombre', example: 'Acme Logistics' })
  @Expose()
  name!: string;

  @ApiProperty({
    description: 'Tipo de compañía',
    enum: CompanyType,
    example: CompanyType.EVENT_ORGANIZER,
  })
  @Expose()
  type!: CompanyType;

  @ApiPropertyOptional({
    description: 'Descripción breve de la empresa',
    example: 'Organizador de eventos tecnológicos.',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL del logo de la empresa',
    example: 'https://cdn.ejemplo.com/upload/companies/123456-uuid-logo.png',
  })
  @Expose()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Nombre de contacto',
    example: 'María Pérez',
  })
  @Expose()
  contactName?: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'ops@acme.com',
  })
  @Expose()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+51 999 999 999',
  })
  @Expose()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Dirección', type: () => AddressDto })
  @Expose()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Porcentaje de comisión (0..1)',
    example: 0.15,
  })
  @Expose()
  commissionRate?: number;

  @ApiPropertyOptional({
    description: 'Configuraciones',
    type: () => CompanySettingsDto,
  })
  @Expose()
  @Type(() => CompanySettingsDto)
  settings?: CompanySettingsDto;

  @ApiProperty({
    description: 'Estado actual de la empresa',
    enum: EntityStatus,
    example: EntityStatus.ACTIVE,
  })
  @Expose()
  entityStatus!: EntityStatus;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-08-25T10:15:30.000Z',
  })
  @Expose()
  createdAt!: Date;
}
