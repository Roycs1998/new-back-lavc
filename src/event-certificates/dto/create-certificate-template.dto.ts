import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsHexColor,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FontConfigDto {
  @ApiProperty({ description: 'Posición X del texto', example: 100 })
  @IsNumber()
  x!: number;

  @ApiProperty({ description: 'Posición Y del texto', example: 200 })
  @IsNumber()
  y!: number;

  @ApiProperty({ description: 'Tamaño de fuente', example: 24 })
  @IsNumber()
  size!: number;

  @ApiProperty({ description: 'Color del texto en Hex', example: '#000000' })
  @IsString()
  @IsHexColor()
  color!: string;

  @ApiPropertyOptional({
    description: 'Familia de fuente',
    example: 'Helvetica',
    default: 'Helvetica',
  })
  @IsOptional()
  @IsString()
  fontFamily?: string;
}

export class CreateCertificateTemplateDto {
  @ApiProperty({
    description: 'Nombre identificador del template',
    example: 'Certificado Ponentes VIP',
  })
  @IsNotEmpty()
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'IDs de los tipos de tickets asociados a este template',
    example: ['66c0da2b6a3aa6ed3c63e001', '66c0da2b6a3aa6ed3c63e002'],
    type: [String],
  })
  @IsArray()
  @IsMongoId({ each: true })
  ticketTypeIds!: string[];

  @ApiProperty({ description: 'Configuración de la fuente para el nombre' })
  @ValidateNested()
  @Type(() => FontConfigDto)
  fontConfig!: FontConfigDto;

  @ApiProperty({
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @IsNotEmpty()
  @IsMongoId()
  eventId!: string;
}
