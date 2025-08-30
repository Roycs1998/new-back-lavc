import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenResponseDto {
  @ApiProperty({
    description: 'Token JWT generado para el usuario autenticado',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0IiwibmFtZSI6Ikp1YW4iLCJpYXQiOjE1MTYyMzkwMjJ9.CXkPjC1aZUvTyQq8ZVxtK3YUmvPgUYZF2ENjJlmFn1g',
  })
  access_token: string;

  @ApiProperty({
    description:
      'Tiempo de expiración del token en formato legible por JWT config (ej: "3600s" o "1h")',
    example: '3600s',
  })
  expires_in: string;
}
