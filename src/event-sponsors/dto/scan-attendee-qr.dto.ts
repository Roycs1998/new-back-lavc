import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScanAttendeeQRDto {
  @ApiProperty({
    description: 'Código QR del asistente (firmado)',
    example: 'eyJ0aWNrZXRJZCI6Ii...signature',
  })
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @ApiPropertyOptional({
    description: 'Información del dispositivo',
    example: { os: 'Android', version: '12' },
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
