import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScanSponsorQRDto {
  @ApiProperty({
    description: 'ID del sponsor que se está escaneando',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @IsNotEmpty()
  @IsString()
  sponsorId: string;

  @ApiPropertyOptional({
    description: 'Información del dispositivo',
    example: { os: 'iOS', version: '15.0' },
  })
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Ubicación del escaneo',
    example: { latitude: -12.0464, longitude: -77.0428 },
  })
  @IsOptional()
  @IsObject()
  location?: Record<string, any>;
}
