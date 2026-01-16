import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class FontConfigResponseDto {
  @ApiProperty()
  @Expose()
  x: number;

  @ApiProperty()
  @Expose()
  y: number;

  @ApiProperty()
  @Expose()
  size: number;

  @ApiProperty()
  @Expose()
  color: string;

  @ApiProperty()
  @Expose()
  fontFamily: string;
}

export class TicketTypeSimpleDto {
  @ApiProperty()
  @Expose()
  _id: string;

  @ApiProperty()
  @Expose()
  name: string;
}

export class CertificateTemplateDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  eventId: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty({ type: [TicketTypeSimpleDto] })
  @Expose()
  @Type(() => TicketTypeSimpleDto)
  ticketTypeIds: TicketTypeSimpleDto[];

  @ApiProperty()
  @Expose()
  fileUrl: string;

  @ApiProperty()
  @Expose()
  @Type(() => FontConfigResponseDto)
  fontConfig: FontConfigResponseDto;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;
}
