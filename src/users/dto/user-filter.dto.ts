import { IsOptional, IsEnum, IsMongoId, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BaseFilterDto } from 'src/common/dto/base-filter.dto';
import { UserRole } from 'src/common/enums/user-role.enum';

export class UserFilterDto extends BaseFilterDto {
  @ApiPropertyOptional({
    description: 'Filtrar por rol del usuario',
    enum: UserRole,
    example: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'El rol debe ser un valor válido de UserRole' })
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de la empresa a la que pertenece el usuario',
    example: '64f14b1a2c4e5a1234567890',
  })
  @IsOptional()
  @IsMongoId({ message: 'El companyId debe ser un ObjectId válido' })
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado de verificación de email',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'El valor de emailVerified debe ser booleano' })
  emailVerified?: boolean;
}
