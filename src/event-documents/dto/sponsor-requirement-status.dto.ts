import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SponsorDocumentStatus } from '../entities/sponsor-document-submission.entity';
import { SponsorDocumentSubmissionDto } from './sponsor-document-submission.dto';

export class SponsorRequirementStatusDto {
  @ApiProperty({
    description: 'ID del requisito de documento',
    example: '66c0da2b6a3aa6ed3c63e201',
  })
  @Expose()
  requirementId!: string;

  @ApiProperty({
    description: 'Título del requisito',
    example: 'Permiso municipal de funcionamiento',
  })
  @Expose()
  title!: string;

  @ApiProperty({
    description: 'Indica si el requisito es obligatorio',
    example: true,
  })
  @Expose()
  isRequired!: boolean;

  @ApiPropertyOptional({
    description: 'Estado del último envío asociado a este requisito',
    enum: SponsorDocumentStatus,
    example: SponsorDocumentStatus.PENDING,
  })
  @Expose()
  lastStatus?: SponsorDocumentStatus;

  @ApiProperty({
    description:
      'Indica si el requisito obligatorio no tiene ningún envío asociado',
    example: false,
  })
  @Expose()
  isMissingRequired!: boolean;

  @ApiPropertyOptional({
    description: 'Último envío realizado para este requisito (si existe)',
    type: SponsorDocumentSubmissionDto,
  })
  @Type(() => SponsorDocumentSubmissionDto)
  @Expose()
  lastSubmission?: SponsorDocumentSubmissionDto;
}
