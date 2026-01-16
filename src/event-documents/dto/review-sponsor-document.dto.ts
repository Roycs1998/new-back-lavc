import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SponsorDocumentStatus } from '../entities/sponsor-document-submission.entity';

export class ReviewSponsorDocumentDto {
  @ApiProperty({
    description: 'Nuevo estado del documento',
    enum: SponsorDocumentStatus,
    example: SponsorDocumentStatus.APPROVED,
  })
  @IsEnum(SponsorDocumentStatus)
  status!: SponsorDocumentStatus;

  @ApiPropertyOptional({
    description:
      'Comentario del revisor. Recomendado cuando el estado es REJECTED.',
    example:
      'El documento está ilegible, por favor adjuntar una versión clara.',
  })
  @IsOptional()
  @IsString()
  reviewerComment?: string;
}
