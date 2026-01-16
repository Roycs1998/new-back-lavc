import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateEventDocumentRequirementDto {
  @ApiProperty({
    description: 'Título del documento requerido',
    example: 'Permiso municipal de funcionamiento',
  })
  @IsNotEmpty()
  @IsString()
  title!: string;

  @ApiPropertyOptional({
    description: 'Descripción detallada del documento requerido',
    example:
      'Documento emitido por la municipalidad que autoriza la realización del evento.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Indica si el documento es obligatorio para todos los sponsors',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean = true;
}
