import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { ShortEventDto } from './event-sponsor.dto';

export class EventsPaginatedDto extends PaginationMetaDto<ShortEventDto> {
  @ApiProperty({ type: [ShortEventDto], example: ShortEventDto })
  declare data: ShortEventDto[];
}
