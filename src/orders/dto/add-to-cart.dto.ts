import { IsString, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({ description: 'Ticket type ID' })
  @IsString()
  ticketTypeId: string;

  @ApiProperty({ description: 'Quantity to add', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}
