import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

export class StatusDto {
  @ApiProperty({ enum: EntityStatus, enumName: 'EntityStatus' })
  @IsEnum(EntityStatus)
  entityStatus: EntityStatus;
}
