import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  IsString,
  IsBoolean,
} from 'class-validator';
import { ParticipantType } from '../../common/enums/participant-type.enum';

export class ListParticipantsQueryDto {
  @ApiPropertyOptional({
    description: 'Número de página',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Cantidad de resultados por página',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Filtrar por ID del patrocinador',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @IsOptional()
  @IsString()
  sponsorId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de participante',
    enum: ParticipantType,
    example: ParticipantType.STAFF,
  })
  @IsOptional()
  @IsEnum(ParticipantType)
  participantType?: ParticipantType;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Buscar por email o nombre del usuario',
    example: 'juan@example.com',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'registeredAt',
    default: 'registeredAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'registeredAt';

  @ApiPropertyOptional({
    description: 'Orden de clasificación (asc o desc)',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
