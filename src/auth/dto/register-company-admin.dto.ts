import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class RegisterCompanyAdminDto extends RegisterDto {
  @ApiProperty({
    description: 'Company IDs that the admin will manage',
    example: ['60d5ecb74f4b2c001f5e4e6a'],
  })
  @IsMongoId({ each: true })
  companyIds: string[];
}
