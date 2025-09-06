import { ApiProperty } from '@nestjs/swagger';
import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { SpeakerDto } from './speaker.dto';

export class SpeakerPaginatedDto extends PaginationMetaDto<SpeakerDto> {
  @ApiProperty({ type: [SpeakerDto], example: SpeakerDto })
  declare data: SpeakerDto[];
}
