import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';
import { ParticipantType } from '../../common/enums/participant-type.enum';

export class CreateQuotaRequestDto {
  @ApiProperty({
    enum: ParticipantType,
    description: 'Tipo de participante para el que se solicita aumento de cupo',
    example: ParticipantType.STAFF,
  })
  @IsEnum(ParticipantType)
  @IsNotEmpty()
  type!: ParticipantType;

  @ApiProperty({
    description: 'Cantidad adicional solicitada',
    example: 5,
    minimum: 1,
  })
  @IsInt()
  @IsPositive()
  @Min(1)
  requestedAmount!: number;

  @ApiProperty({
    description: 'Motivo de la solicitud',
    example:
      'Necesitamos más personal para el stand debido a la alta afluencia esperada.',
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
