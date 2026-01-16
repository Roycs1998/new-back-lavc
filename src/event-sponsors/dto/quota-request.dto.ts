import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ParticipantType } from '../../common/enums/participant-type.enum';
import { QuotaRequestStatus } from '../entities/sponsor-quota-request.entity';

export class QuotaRequestDto {
  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e005' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e004' })
  @Expose()
  eventSponsorId!: string;

  @ApiProperty({ enum: ParticipantType, example: ParticipantType.STAFF })
  @Expose()
  type!: ParticipantType;

  @ApiProperty({ example: 5 })
  @Expose()
  requestedAmount!: number;

  @ApiProperty({ example: 'Necesitamos más personal.' })
  @Expose()
  reason!: string;

  @ApiProperty({
    enum: QuotaRequestStatus,
    example: QuotaRequestStatus.PENDING,
  })
  @Expose()
  status!: QuotaRequestStatus;

  @ApiProperty({ example: 5, required: false })
  @Expose()
  approvedAmount?: number;

  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e001', required: false })
  @Expose()
  reviewedBy?: string;

  @ApiProperty({ example: '2024-08-20T10:00:00Z', required: false })
  @Expose()
  reviewedAt?: Date;

  @ApiProperty({ example: 'Rechazado por aforo.', required: false })
  @Expose()
  rejectionReason?: string;

  @ApiProperty({ example: '2024-08-19T10:00:00Z' })
  @Expose()
  createdAt!: Date;
}
