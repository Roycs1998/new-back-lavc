import {
  IsNotEmpty,
  IsNumber,
  IsMongoId,
  Min,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEventSponsorDto {
  @ApiProperty({
    description: 'ID de la empresa patrocinadora',
    example: '66bfca24c3baf17b08c9b111',
  })
  @IsNotEmpty()
  @IsMongoId()
  companyId!: string;

  @ApiPropertyOptional({
    description: 'Cuota de miembros del staff de la empresa',
    example: 10,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  staffQuota?: number = 0;

  @ApiPropertyOptional({
    description: 'Cuota de invitados que puede asignar la empresa',
    example: 50,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  guestQuota?: number = 0;

  @ApiPropertyOptional({
    description: 'Cuota de becas que puede otorgar la empresa',
    example: 5,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  scholarshipQuota?: number = 0;
}
