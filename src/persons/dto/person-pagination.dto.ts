import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { PersonDto } from './person.dto';

export class PersonPaginatedDto extends PaginationMetaDto<PersonDto> {
  @ApiProperty({ type: [PersonDto], example: PersonDto })
  declare data: PersonDto[];
}
