import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';
import { PersonType } from '../../common/enums/person-type.enum';

export class PersonFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por tipo de persona',
    enum: PersonType,
    example: PersonType.USER_PERSON,
  })
  @IsOptional()
  @IsEnum(PersonType, { message: 'El tipo de persona no es válido' })
  type?: PersonType;
}
