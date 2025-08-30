import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { UserDto } from 'src/users/dto/user.dto';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Información del usuario autenticado',
    type: () => UserDto,
  })
  @Expose()
  @Type(() => UserDto)
  user: UserDto;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Token JWT de acceso',
  })
  @Expose()
  access_token: string;

  @ApiProperty({
    example: '3600s',
    description: 'Tiempo de expiración del token de acceso',
  })
  @Expose()
  expires_in: string;
}
