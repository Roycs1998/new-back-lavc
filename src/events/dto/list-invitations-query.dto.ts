import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsEnum,
  IsBoolean,
  IsMongoId,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { ParticipantType } from '../../common/enums/participant-type.enum';
import { InvitationUsageType } from '../../common/enums/invitation-usage-type.enum';

export class ListInvitationsQueryDto {
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
    description: 'Filtrar por ID del sponsor',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @IsOptional()
  @IsMongoId()
  sponsorId?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de participante',
    enum: ParticipantType,
    example: ParticipantType.GUEST,
  })
  @IsOptional()
  @IsEnum(ParticipantType)
  participantType?: ParticipantType;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de uso',
    enum: InvitationUsageType,
    example: InvitationUsageType.SINGLE,
  })
  @IsOptional()
  @IsEnum(InvitationUsageType)
  usageType?: InvitationUsageType;

  @ApiPropertyOptional({
    description: 'Filtrar por estado activo/inactivo',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por invitaciones expiradas',
    example: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isExpired?: boolean;

  @ApiPropertyOptional({
    description: 'Filtrar por invitaciones con usos disponibles',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasAvailableUses?: boolean;

  @ApiPropertyOptional({
    description: 'Campo por el cual ordenar',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

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
