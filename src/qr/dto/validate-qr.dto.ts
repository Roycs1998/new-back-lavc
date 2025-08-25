import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ValidateQRDto {
  @ApiProperty({ description: 'Código QR a validar' })
  @IsString()
  qrCode: string;

  @ApiPropertyOptional({ description: 'Notas de validación' })
  @IsOptional()
  @IsString()
  validationNotes?: string;

  @ApiPropertyOptional({ description: 'Información del dispositivo' })
  @IsOptional()
  @IsString()
  deviceInfo?: string;

  @ApiPropertyOptional({ description: 'Ubicación GPS del validator' })
  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
  };
}
