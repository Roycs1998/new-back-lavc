import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { SponsorRequirementStatusDto } from './sponsor-requirement-status.dto';

export class SponsorDocumentsBySponsorDto {
  @ApiProperty({
    description: 'ID del patrocinador del evento',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @Expose()
  sponsorId!: string;

  @ApiProperty({
    description: 'ID de la empresa patrocinadora',
    example: '66bfca24c3baf17b08c9b111',
  })
  @Expose()
  companyId!: string;

  @ApiProperty({
    description: 'Nombre de la empresa patrocinadora',
    example: 'Acme Corp',
  })
  @Expose()
  companyName!: string;

  @ApiPropertyOptional({
    description: 'Email de contacto de la empresa (si está disponible)',
    example: 'contacto@acmecorp.com',
  })
  @Expose()
  companyEmail?: string;

  @ApiProperty({
    description: 'Lista de requisitos y su estado para este sponsor',
    type: [SponsorRequirementStatusDto],
  })
  @Type(() => SponsorRequirementStatusDto)
  @Expose()
  requirements!: SponsorRequirementStatusDto[];

  @ApiProperty({
    description: 'Cantidad de requisitos obligatorios incumplidos',
    example: 1,
  })
  @Expose()
  missingRequiredCount!: number;

  @ApiProperty({
    description: 'Cantidad total de requisitos obligatorios',
    example: 3,
  })
  @Expose()
  totalRequired!: number;

  @ApiProperty({
    description:
      'Indica si el sponsor cumplió todos los requisitos obligatorios',
    example: false,
  })
  @Expose()
  isCompliant!: boolean;
}
