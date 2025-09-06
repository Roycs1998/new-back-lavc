import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { EventDto } from './event.dto';

export class EventPaginatedDto extends PaginationMetaDto<EventDto> {
  @ApiProperty({ type: [EventDto] })
  declare data: EventDto[];
}
