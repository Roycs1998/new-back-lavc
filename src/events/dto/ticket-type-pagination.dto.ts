import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { TicketTypeDto } from './ticket-type.dto';

export class TicketTypePaginatedDto extends PaginationMetaDto<TicketTypeDto> {
  @ApiProperty({ type: [TicketTypeDto] })
  declare data: TicketTypeDto[];
}
