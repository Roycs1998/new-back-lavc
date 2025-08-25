import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LocationDto {
  @ApiProperty({ description: 'Latitud GPS', example: -12.0464 })
  @IsNumber({}, { message: 'La latitud debe ser un número' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  latitude: number;

  @ApiProperty({ description: 'Longitud GPS', example: -77.0428 })
  @IsNumber({}, { message: 'La longitud debe ser un número' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  longitude: number;
}

export class ValidateQRDto {
  @ApiProperty({
    description: 'Código QR a validar (string firmado)',
    example:
      'eyJ0aWNrZXRJZCI6IjUwN2YxZjc3YmNmODZjZDc5OTQzOTAxMSJ9.abc123def456',
  })
  @IsString({ message: 'El código QR debe ser un string' })
  @IsNotEmpty({ message: 'El código QR es requerido' })
  qrCode: string;

  @ApiPropertyOptional({
    description: 'Notas adicionales del validador',
    example: 'Entrada principal - Sin problemas',
  })
  @IsOptional()
  @IsString({ message: 'Las notas deben ser un string' })
  validationNotes?: string;

  @ApiPropertyOptional({
    description: 'Información del dispositivo (se convertirá a JSON string)',
    example: {
      type: 'mobile',
      os: 'Android 12',
      browser: 'Chrome 91',
      app: 'LAVC Scanner v1.2',
    },
  })
  @IsOptional()
  @IsObject({ message: 'La información del dispositivo debe ser un objeto' })
  deviceInfo?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Ubicación GPS donde se validó el código',
    type: LocationDto,
  })
  @IsOptional()
  @Type(() => LocationDto)
  location?: LocationDto;
}
