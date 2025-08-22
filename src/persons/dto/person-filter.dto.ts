import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';
import { PersonType } from '../../common/enums/person-type.enum';

export class PersonFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by person type',
    enum: PersonType,
  })
  @IsOptional()
  @IsEnum(PersonType)
  type?: PersonType;
}
