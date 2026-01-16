import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class EventDocumentRequirementDto {
  @ApiProperty({
    description: 'ID del requisito de documento',
    example: '66c0da2b6a3aa6ed3c63e201',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID del evento al que pertenece el requisito',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @Expose()
  eventId!: string;

  @ApiProperty({
    description: 'Título del documento requerido',
    example: 'Permiso municipal de funcionamiento',
  })
  @Expose()
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del documento requerido',
    example:
      'Documento emitido por la municipalidad que autoriza la realización del evento.',
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Indica si el documento es obligatorio para el sponsor',
    example: true,
  })
  @Expose()
  isRequired!: boolean;

  @ApiProperty({
    description: 'Indica si el requisito está activo',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    description: 'Fecha de creación del requisito',
    example: '2025-08-01T10:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del requisito',
    example: '2025-08-10T15:30:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
