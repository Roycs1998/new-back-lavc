import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsBoolean, IsDate, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {
  @ApiPropertyOptional({
    description: 'Indicates if the user is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Opaque token used to reset the user password',
    example: 'prt_0b3c96bd1a7a4e6db3e2f1f1a3c2',
  })
  @IsOptional()
  @IsString()
  passwordResetToken?: string;

  @ApiPropertyOptional({
    description: 'Opaque token used to verify the user email',
    example: 'evt_eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  @IsOptional()
  @IsString()
  emailVerificationToken?: string;

  @ApiPropertyOptional({
    description: 'Expiration datetime for the password reset token (ISO 8601)',
    example: '2025-09-01T12:00:00.000Z',
  })
  @IsOptional()
  @IsDate({
    message: 'passwordResetExpires must be a valid Date (ISO 8601 parsable)',
  })
  passwordResetExpires?: Date;
}
