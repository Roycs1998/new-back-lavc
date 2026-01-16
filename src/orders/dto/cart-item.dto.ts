import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { Currency } from 'src/common/enums/currency.enum';

@Exclude()
class CartEventViewDto {
  @ApiProperty({ example: '66f0a1c9b8f2a84f0a3f1123' })
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString?.())
  id!: string;

  @ApiProperty({ example: 'Congreso Internacional 2025' })
  @Expose()
  title!: string;

  @ApiProperty({ example: '2025-10-01T13:00:00.000Z' })
  @Expose()
  startDate!: Date;

  @ApiProperty({ example: '2025-10-02T23:59:59.000Z' })
  @Expose()
  endDate!: Date;
}

@Exclude()
class TicketRestrictionsViewDto {
  @ApiProperty({ example: 1 })
  @Expose()
  minPerOrder!: number;

  @ApiProperty({ example: 10 })
  @Expose()
  maxPerOrder!: number;

  @ApiPropertyOptional({ example: 4 })
  @Expose()
  maxPerUser?: number;

  @ApiProperty({ example: false })
  @Expose()
  requiresApproval!: boolean;

  @ApiProperty({ example: true })
  @Expose()
  transferable!: boolean;

  @ApiProperty({ example: false })
  @Expose()
  refundable!: boolean;
}

@Exclude()
class CartTicketTypeViewDto {
  @ApiProperty({ example: '66f0b2d9c1a2b34c5d6e7f80' })
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString?.())
  id!: string;

  @ApiProperty({ example: 'General' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ example: 'Acceso a todas las charlas' })
  @Expose()
  description?: string;

  @ApiProperty({ example: 150.0 })
  @Expose()
  price!: number;

  @ApiProperty({ enum: Currency, example: Currency.PEN })
  @Expose()
  currency!: Currency;

  @ApiProperty({ type: TicketRestrictionsViewDto })
  @Type(() => TicketRestrictionsViewDto)
  @Expose()
  restrictions!: TicketRestrictionsViewDto;
}

@Exclude()
export class CartItemDto {
  @ApiProperty({ example: '66ff11223344556677889900' })
  @Expose()
  @Transform(({ obj }) => obj?._id?.toString?.())
  id!: string;

  @ApiProperty({ example: 2 })
  @Expose()
  quantity!: number;

  @ApiProperty({ example: 120 })
  @Expose()
  unitPrice!: number;

  @ApiProperty({ enum: Currency, example: Currency.PEN })
  @Expose()
  currency!: Currency;

  @ApiPropertyOptional({ example: '2025-09-30T15:00:00.000Z' })
  @Expose()
  reservedUntil?: Date;

  @ApiProperty({ example: false })
  @Expose()
  isReserved!: boolean;

  @ApiProperty({ description: 'Precio total del ítem', example: 240 })
  @Expose()
  totalPrice!: number;

  @ApiProperty({
    description: 'Evento asociado (populate de eventId)',
    type: CartEventViewDto,
  })
  @Type(() => CartEventViewDto)
  @Expose()
  event!: CartEventViewDto;

  @ApiProperty({
    description: 'Tipo de ticket asociado (populate de ticketTypeId)',
    type: CartTicketTypeViewDto,
  })
  @Type(() => CartTicketTypeViewDto)
  @Expose()
  ticketType!: CartTicketTypeViewDto;

  @ApiProperty({ example: '2025-09-10T12:30:45.000Z' })
  @Expose()
  createdAt!: Date;
}
