import { PaginationMetaDto } from 'src/common/dto/pagination-meta.dto';
import { UserDto } from './user.dto';
import { ApiProperty } from '@nestjs/swagger';

export class UserPaginatedDto extends PaginationMetaDto<UserDto> {
  @ApiProperty({ type: [UserDto], example: UserDto })
  declare data: UserDto[];
}
