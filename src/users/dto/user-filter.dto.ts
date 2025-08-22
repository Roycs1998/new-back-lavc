import { IsOptional, IsEnum, IsMongoId } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from '../../common/dto/base-filter.dto';
import { UserRole } from '../../common/enums/user-role.enum';

export class UserFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by user role',
    enum: UserRole,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Filter by company ID' })
  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @ApiPropertyOptional({ description: 'Filter by email verification status' })
  @IsOptional()
  emailVerified?: boolean;
}
