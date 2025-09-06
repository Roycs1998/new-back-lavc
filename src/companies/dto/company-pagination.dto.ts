import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { CompanyDto } from './company.dto';

export class CompanyPaginatedDto extends PaginationMetaDto<CompanyDto> {
  @ApiProperty({ type: [CompanyDto], example: CompanyDto })
  declare data: CompanyDto[];
}
