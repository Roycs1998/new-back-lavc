import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';
import { ParticipantType } from '../../common/enums/participant-type.enum';
import { InvitationUsageType } from '../../common/enums/invitation-usage-type.enum';
import { EventDto } from './event.dto';

class InvitationTicketTypeDto {
  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e010' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'General Access' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 50 })
  @Expose()
  price!: number;
}

class InvitationCompanyDto {
  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e200' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'ACME Corp' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ example: '20123456789' })
  @Expose()
  ruc?: string;

  @ApiPropertyOptional({
    example: 'https://storage.example.com/logos/acme.png',
  })
  @Expose()
  logoUrl?: string | null;
}

class InvitationSponsorDto {
  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e004' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e001' })
  @Expose()
  eventId!: string;

  @ApiProperty({ type: InvitationCompanyDto })
  @Type(() => InvitationCompanyDto)
  @Expose()
  company!: InvitationCompanyDto;
}

class InvitationUserSimpleDto {
  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e020' })
  @Expose()
  id!: string;

  @ApiProperty({ example: 'user@example.com' })
  @Expose()
  email!: string;

  @ApiProperty({ example: 'John' })
  @Expose()
  firstName!: string;

  @ApiProperty({ example: 'Doe' })
  @Expose()
  lastName!: string;

  @ApiProperty({ example: 'John Doe' })
  @Expose()
  @Transform(({ obj }) => {
    const firstName = obj.firstName;
    const lastName = obj.lastName;
    return `${firstName ?? ''} ${lastName ?? ''}`.trim() || undefined;
  })
  fullName!: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @Expose()
  phone?: string;
}

class InvitationUseDto {
  @ApiProperty({ type: InvitationUserSimpleDto })
  @Expose({ name: 'userId' })
  @Type(() => InvitationUserSimpleDto)
  user!: InvitationUserSimpleDto;

  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e005' })
  @Expose()
  participantId!: string;

  @ApiProperty({ example: '2025-12-01T10:00:00.000Z' })
  @Expose()
  usedAt!: Date;
}

export class SponsorInvitationDto {
  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e020' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e004' })
  @Expose()
  eventSponsorId!: string;

  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e001' })
  @Expose()
  eventId!: string;

  @ApiProperty({ example: 'ACME2025-XYZ789' })
  @Expose()
  code!: string;

  @ApiProperty({ enum: ParticipantType, example: ParticipantType.STAFF })
  @Expose()
  participantType!: ParticipantType;

  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e010' })
  @Expose()
  ticketTypeId!: string;

  @ApiProperty({
    enum: InvitationUsageType,
    example: InvitationUsageType.MULTIPLE,
  })
  @Expose()
  usageType!: InvitationUsageType;

  @ApiPropertyOptional({ example: 10 })
  @Expose()
  maxUses?: number | null;

  @ApiProperty({ example: 7 })
  @Expose()
  currentUses!: number;

  @ApiPropertyOptional({ example: 3 })
  @Expose()
  remainingUses?: number | null;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59Z' })
  @Expose()
  expiresAt?: Date | null;

  @ApiProperty({ example: true })
  @Expose()
  isActive!: boolean;

  @ApiPropertyOptional({ type: InvitationTicketTypeDto })
  @Type(() => InvitationTicketTypeDto)
  @Expose()
  ticketType?: InvitationTicketTypeDto;

  @ApiPropertyOptional({ type: InvitationSponsorDto })
  @Type(() => InvitationSponsorDto)
  @Expose()
  eventSponsor?: InvitationSponsorDto;

  @ApiPropertyOptional({ type: EventDto })
  @Type(() => EventDto)
  @Expose()
  event?: EventDto;

  @ApiPropertyOptional({ type: [InvitationUseDto] })
  @Type(() => InvitationUseDto)
  @Expose()
  uses?: InvitationUseDto[];

  @ApiProperty({ example: '2025-12-01T10:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiProperty({ example: '2025-12-01T10:00:00.000Z' })
  @Expose()
  updatedAt!: Date;
}
