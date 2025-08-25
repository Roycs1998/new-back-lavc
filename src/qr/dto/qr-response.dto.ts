import { ApiProperty } from '@nestjs/swagger';
import { EntryStatus } from '../../common/enums/entry-status.enum';

export class QRResponseDto {
  @ApiProperty()
  qrCode: string;

  @ApiProperty()
  qrDataUrl: string;

  @ApiProperty()
  ticketInfo: {
    id: string;
    ticketNumber: string;
    eventTitle: string;
    eventDate: Date;
    attendeeName: string;
    ticketType: string;
    price: number;
  };

  @ApiProperty()
  generatedAt: Date;
}

export class ValidationResponseDto {
  @ApiProperty({ enum: EntryStatus })
  status: EntryStatus;

  @ApiProperty()
  message: string;

  @ApiProperty()
  isValid: boolean;

  @ApiProperty()
  ticketInfo?: {
    id: string;
    ticketNumber: string;
    eventTitle: string;
    eventDate: Date;
    attendeeName: string;
    ticketType: string;
    seatNumber?: string;
    alreadyUsed?: boolean;
  };

  @ApiProperty()
  validatedAt: Date;

  @ApiProperty()
  validatedBy?: string;
}
