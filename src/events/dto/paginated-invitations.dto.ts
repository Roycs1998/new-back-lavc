import { ApiProperty } from '@nestjs/swagger';
import { SponsorInvitationDto } from './sponsor-invitation.dto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total de registros',
    example: 100,
  })
  total!: number;

  @ApiProperty({
    description: 'Página actual',
    example: 1,
  })
  page!: number;

  @ApiProperty({
    description: 'Cantidad de registros por página',
    example: 10,
  })
  limit!: number;

  @ApiProperty({
    description: 'Total de páginas',
    example: 10,
  })
  totalPages!: number;

  @ApiProperty({
    description: 'Indica si hay una página siguiente',
    example: true,
  })
  hasNextPage!: boolean;

  @ApiProperty({
    description: 'Indica si hay una página anterior',
    example: false,
  })
  hasPrevPage!: boolean;
}

export class PaginatedInvitationsDto {
  @ApiProperty({
    description: 'Lista de invitaciones',
    type: [SponsorInvitationDto],
  })
  data!: SponsorInvitationDto[];

  @ApiProperty({
    description: 'Metadatos de paginación',
    type: PaginationMetaDto,
  })
  meta!: PaginationMetaDto;
}
