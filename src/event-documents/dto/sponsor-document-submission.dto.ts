import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SponsorDocumentStatus } from '../entities/sponsor-document-submission.entity';

export class SponsorDocumentSubmissionDto {
  @ApiProperty({
    description: 'ID del envío de documento',
    example: '66c0da2b6a3aa6ed3c63f301',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID del requisito de documento al que responde',
    example: '66c0da2b6a3aa6ed3c63e201',
  })
  @Expose()
  requirementId!: string;

  @ApiProperty({
    description: 'ID del patrocinador del evento',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @Expose()
  eventSponsorId!: string;

  @ApiProperty({
    description: 'ID de la empresa que envía el documento',
    example: '66bfca24c3baf17b08c9b111',
  })
  @Expose()
  companyId!: string;

  @ApiProperty({
    description: 'Clave interna del archivo en el storage',
    example: 'upload/documents/1723981723-uuid-permiso.pdf',
  })
  @Expose()
  fileKey!: string;

  @ApiProperty({
    description: 'URL pública o interna del archivo almacenado',
    example: 'https://cdn.lavc.com/upload/documents/permiso.pdf',
  })
  @Expose()
  fileUrl!: string;

  @ApiPropertyOptional({
    description: 'Nombre original del archivo',
    example: 'permiso-municipal-2025.pdf',
  })
  @Expose()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Tipo MIME del archivo',
    example: 'application/pdf',
  })
  @Expose()
  fileMimeType?: string;

  @ApiPropertyOptional({
    description: 'Tamaño del archivo en bytes',
    example: 524288,
  })
  @Expose()
  fileSize?: number;

  @ApiProperty({
    description: 'Estado de revisión del documento',
    enum: SponsorDocumentStatus,
    example: SponsorDocumentStatus.PENDING,
  })
  @Expose()
  status!: SponsorDocumentStatus;

  @ApiPropertyOptional({
    description: 'Comentario del revisor cuando el documento es rechazado',
    example:
      'El documento está vencido, por favor enviar la versión actualizada.',
  })
  @Expose()
  reviewerComment?: string;

  @ApiPropertyOptional({
    description: 'ID del usuario que revisó el documento',
    example: '66bfca24c3baf17b08c9b999',
  })
  @Expose()
  reviewedBy?: string;

  @ApiPropertyOptional({
    description: 'Fecha en la que se revisó el documento',
    example: '2025-08-05T09:30:00.000Z',
  })
  @Expose()
  reviewedAt?: Date;

  @ApiProperty({
    description: 'ID del usuario que subió el archivo',
    example: '66bfca24c3baf17b08c9b555',
  })
  @Expose()
  uploadedBy!: string;

  @ApiProperty({
    description: 'Fecha de creación del envío',
    example: '2025-08-04T12:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización del envío',
    example: '2025-08-05T09:30:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
