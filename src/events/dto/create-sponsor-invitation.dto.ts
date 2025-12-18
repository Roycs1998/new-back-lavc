import {
  IsNotEmpty,
  IsEnum,
  IsMongoId,
  IsNumber,
  Min,
  IsOptional,
  IsDateString,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ParticipantType } from '../../common/enums/participant-type.enum';
import { InvitationUsageType } from '../../common/enums/invitation-usage-type.enum';

export class CreateSponsorInvitationDto {
  @ApiProperty({
    description: 'Tipo de participante para esta invitación',
    enum: ParticipantType,
    example: ParticipantType.STAFF,
  })
  @IsNotEmpty()
  @IsEnum(ParticipantType)
  participantType!: ParticipantType;

  @ApiPropertyOptional({
    description:
      'ID del tipo de ticket a asignar (si no se especifica, se asigna el más barato)',
    example: '66c0da2b6a3aa6ed3c63e010',
  })
  @IsOptional()
  @IsMongoId()
  ticketTypeId?: string;

  @ApiProperty({
    description: 'Tipo de uso de la invitación',
    enum: InvitationUsageType,
    example: InvitationUsageType.MULTIPLE,
  })
  @IsNotEmpty()
  @IsEnum(InvitationUsageType)
  usageType!: InvitationUsageType;

  @ApiPropertyOptional({
    description: 'Número máximo de usos (requerido si usageType es MULTIPLE)',
    example: 10,
    minimum: 1,
  })
  @ValidateIf((o) => o.usageType === InvitationUsageType.MULTIPLE)
  @IsNotEmpty({ message: 'maxUses es requerido cuando usageType es MULTIPLE' })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  maxUses?: number;

  @ApiPropertyOptional({
    description: 'Fecha de expiración de la invitación (opcional)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
