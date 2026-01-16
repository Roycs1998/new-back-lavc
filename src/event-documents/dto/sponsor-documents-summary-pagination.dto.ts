import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { SponsorDocumentsBySponsorDto } from './sponsor-documents-by-sponsor.dto';

export class SponsorDocumentsPaginatedDto extends PaginationMetaDto<SponsorDocumentsBySponsorDto> {
  @ApiProperty({
    description: 'Lista de sponsors con el estado de sus documentos',
    type: [SponsorDocumentsBySponsorDto],
  })
  declare data: SponsorDocumentsBySponsorDto[];
}
