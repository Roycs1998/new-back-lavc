import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

class ShortCompanyDto {
  @ApiProperty({
    description: 'ID de la empresa',
    example: '66bfca24c3baf17b08c9b111',
  })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Nombre de la empresa', example: 'Acme Corp' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'Email de contacto',
    example: 'contact@acme.com',
  })
  @Expose()
  contactEmail?: string;
}

export class ShortEventDto {
  @ApiProperty({
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Título del evento',
    example: 'Tech Conference 2024',
  })
  @Expose()
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripción corta del evento',
    example: 'El evento tecnológico más importante del año',
  })
  @Expose()
  shortDescription?: string;

  @ApiProperty({
    description: 'Fecha de inicio del evento',
    example: '2024-09-15T09:00:00.000Z',
  })
  @Expose()
  startDate!: Date;

  @ApiProperty({
    description: 'Fecha de fin del evento',
    example: '2024-09-17T18:00:00.000Z',
  })
  @Expose()
  endDate!: Date;

  @ApiProperty({
    description: 'Estado del evento',
    example: 'published',
  })
  @Expose()
  eventStatus!: string;
}

export class EventSponsorDto {
  @ApiProperty({
    description: 'ID del patrocinador',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @Expose()
  eventId!: string;

  @ApiProperty({
    description: 'ID de la empresa patrocinadora',
    example: '66bfca24c3baf17b08c9b111',
  })
  @Expose()
  companyId!: string;

  @ApiProperty({
    description: 'Cuota total de staff asignada',
    example: 10,
  })
  @Expose()
  staffQuota!: number;

  @ApiProperty({
    description: 'Cuota total de invitados asignada',
    example: 50,
  })
  @Expose()
  guestQuota!: number;

  @ApiProperty({
    description: 'Cuota total de becas asignada',
    example: 5,
  })
  @Expose()
  scholarshipQuota!: number;

  @ApiProperty({
    description: 'Cantidad de staff ya registrado',
    example: 7,
  })
  @Expose()
  staffUsed!: number;

  @ApiProperty({
    description: 'Cantidad de invitados ya registrados',
    example: 32,
  })
  @Expose()
  guestUsed!: number;

  @ApiProperty({
    description: 'Cantidad de becas ya otorgadas',
    example: 3,
  })
  @Expose()
  scholarshipUsed!: number;

  @ApiProperty({
    description: 'Staff disponible (calculado)',
    example: 3,
  })
  @Expose()
  staffAvailable?: number;

  @ApiProperty({
    description: 'Invitados disponibles (calculado)',
    example: 18,
  })
  @Expose()
  guestAvailable?: number;

  @ApiProperty({
    description: 'Becas disponibles (calculado)',
    example: 2,
  })
  @Expose()
  scholarshipAvailable?: number;

  @ApiProperty({
    description: 'Estado activo del patrocinador',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'Fecha de asignación del patrocinador',
    example: '2025-08-01T10:00:00.000Z',
  })
  @Expose()
  assignedAt!: Date;

  @ApiPropertyOptional({
    description: 'Información de la empresa',
    type: ShortCompanyDto,
  })
  @Type(() => ShortCompanyDto)
  @Expose()
  company?: ShortCompanyDto;

  @ApiPropertyOptional({
    description: 'Información del evento',
    type: ShortEventDto,
  })
  @Type(() => ShortEventDto)
  @Expose()
  event?: ShortEventDto;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-08-01T10:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-08-15T14:30:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
