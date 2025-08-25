import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';

export class ApiResponseDto<T = any> {
  @ApiProperty({
    example: true,
    description: 'Indica si la operación fue exitosa',
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    example: 'Operación completada exitosamente',
    description: 'Mensaje descriptivo de la operación',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: 'Datos de respuesta' })
  @IsOptional()
  data?: T;

  @ApiPropertyOptional({
    description: 'Metadatos adicionales (paginación, etc.)',
  })
  @IsOptional()
  meta?: Record<string, any>;

  @ApiPropertyOptional({
    example: '2024-08-25T10:30:00Z',
    description: 'Timestamp de la respuesta',
  })
  @IsOptional()
  timestamp?: string;

  constructor(
    success: boolean,
    message: string,
    data?: T,
    meta?: Record<string, any>,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(
    data: T,
    message = 'Operación exitosa',
    meta?: Record<string, any>,
  ): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data, meta);
  }

  static error(message: string, meta?: Record<string, any>): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, meta);
  }
}
