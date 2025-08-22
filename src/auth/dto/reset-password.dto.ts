import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token',
    example: 'abc123def456',
  })
  @IsString()
  token: string;

  @ApiProperty({
    description: 'New password',
    minLength: 8,
    example: 'NewSecurePass123!',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
