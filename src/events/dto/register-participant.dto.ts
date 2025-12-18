import { IsNotEmpty, IsMongoId, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ParticipantType } from '../../common/enums/participant-type.enum';

export class RegisterParticipantDto {
  @ApiProperty({
    description: 'ID del usuario a registrar como participante',
    example: '66c0da2b6a3aa6ed3c63e002',
  })
  @IsNotEmpty()
  @IsMongoId()
  userId!: string;

  @ApiProperty({
    description: 'ID del patrocinador del evento',
    example: '66c0da2b6a3aa6ed3c63e003',
  })
  @IsNotEmpty()
  @IsMongoId()
  eventSponsorId!: string;

  @ApiProperty({
    description: 'Tipo de participante',
    enum: ParticipantType,
    example: ParticipantType.STAFF,
  })
  @IsNotEmpty()
  @IsEnum(ParticipantType)
  participantType!: ParticipantType;
}
