import { IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class GenerateQRDto {
  @ApiProperty({ description: 'Ticket ID para generar QR' })
  @IsMongoId()
  ticketId: Types.ObjectId;
}
