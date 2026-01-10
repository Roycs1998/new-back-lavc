import { IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AcceptInvitationForUserDto {
  @ApiProperty({
    description: 'ID del usuario que aceptará la invitación',
    example: '66c0da2b6a3aa6ed3c63e002',
  })
  @IsNotEmpty()
  @IsMongoId()
  userId!: string;
}
