import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';
import { RegisterDto } from './register.dto';
import { CreateCompanyDto } from 'src/companies/dto/create-company.dto';

export class RegisterWithCompanyDto extends RegisterDto {
  @ApiProperty({
    description:
      'Datos de la empresa que se creará junto con el usuario administrador',
    type: () => CreateCompanyDto,
  })
  @ValidateNested()
  @Type(() => CreateCompanyDto)
  company: CreateCompanyDto;
}
