import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

export class ChangeCompanyStatusDto {
  @ApiProperty({
    description: 'Nuevo estado de la empresa',
    enum: EntityStatus,
    example: EntityStatus.INACTIVE,
  })
  @IsEnum(EntityStatus, {
    message: 'entityStatus debe ser un valor válido de EntityStatus',
  })
  entityStatus!: EntityStatus;
}
