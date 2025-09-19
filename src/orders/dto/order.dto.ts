import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { Currency } from 'src/common/enums/currency.enum';
import { DocumentType } from 'src/common/enums/document-type.enum';
import { OrderStatus } from 'src/common/enums/order-status.enum';

export class OrderItemDto {
  @ApiProperty({
    description: 'ID del TicketType al que corresponde el item',
    example: '66f0b2d9c1a2b34c5d6e7f80',
  })
  @Expose()
  ticketTypeId!: string;

  @ApiProperty({
    description: 'Nombre del tipo de ticket al momento de la compra',
    example: 'General',
  })
  @Expose()
  ticketTypeName!: string;

  @ApiProperty({ description: 'Cantidad comprada', example: 2 })
  @Expose()
  quantity!: number;

  @ApiProperty({ description: 'Precio unitario', example: 120 })
  @Expose()
  unitPrice!: number;

  @ApiProperty({
    description: 'Total del item (quantity x unitPrice)',
    example: 240,
  })
  @Expose()
  totalPrice!: number;

  @ApiProperty({ enum: Currency, example: Currency.PEN })
  @Expose()
  currency!: Currency;
}

export class CustomerInfoViewDto {
  @ApiProperty({ example: 'Juan' })
  @Expose()
  firstName!: string;

  @ApiProperty({ example: 'Pérez' })
  @Expose()
  lastName!: string;

  @ApiProperty({ example: 'juan.perez@example.com' })
  @Expose()
  email!: string;

  @ApiPropertyOptional({ example: '+51987654321' })
  @Expose()
  phone?: string;

  @ApiProperty({ enum: DocumentType, example: DocumentType.DNI })
  @Expose()
  documentType!: DocumentType;

  @ApiProperty({ example: '87654321' })
  @Expose()
  documentNumber!: string;
}

export class BillingInfoViewDto {
  @ApiPropertyOptional({ example: 'ACME S.A.C.' })
  @Expose()
  companyName?: string;

  @ApiPropertyOptional({ example: '20123456789' })
  @Expose()
  ruc?: string;

  @ApiPropertyOptional({ example: 'Av. Siempre Viva 123, Lima' })
  @Expose()
  address?: string;

  @ApiProperty({ example: false })
  @Expose()
  isCompany!: boolean;
}

export class ShortEventViewDto {
  @ApiProperty({ example: '66f0a1c9b8f2a84f0a3f1123' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Congreso Internacional 2025' })
  @Expose()
  title: string;

  @ApiProperty({ example: '2025-10-01T13:00:00.000Z' })
  @Expose()
  startDate!: Date;

  @ApiProperty({ example: '2025-10-02T23:59:59.000Z' })
  @Expose()
  endDate!: Date;
}

export class OrderDto {
  @ApiProperty({ example: '66ff11223344556677889900' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '66efaa22bb33cc44dd55ee66' })
  @Expose()
  userId!: string;

  @ApiProperty({
    description: 'Número de pedido único con fecha y secuencia diaria',
    example: 'ORD-20250907-003',
  })
  @Expose()
  orderNumber!: string;

  @ApiProperty({
    description: 'Evento (populate de eventId)',
    type: ShortEventViewDto,
  })
  @Type(() => ShortEventViewDto)
  @Expose()
  event!: ShortEventViewDto;

  @ApiProperty({
    description: 'Ítems del pedido',
    type: [OrderItemDto],
  })
  @Type(() => OrderItemDto)
  @Expose()
  items!: OrderItemDto[];

  @ApiProperty({ example: 360 })
  @Expose()
  subtotal!: number;

  @ApiProperty({ example: 0 })
  @Expose()
  discountAmount!: number;

  @ApiProperty({ example: 360 })
  @Expose()
  total!: number;

  @ApiProperty({ enum: Currency, example: Currency.PEN })
  @Expose()
  currency!: Currency;

  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PENDING_PAYMENT })
  @Expose()
  status!: OrderStatus;

  @ApiProperty({ type: CustomerInfoViewDto })
  @Type(() => CustomerInfoViewDto)
  @Expose()
  customerInfo!: CustomerInfoViewDto;

  @ApiPropertyOptional({ type: BillingInfoViewDto })
  @Type(() => BillingInfoViewDto)
  @Expose()
  billingInfo?: BillingInfoViewDto;

  @ApiPropertyOptional({
    description: 'Fecha de expiración del pedido (pago pendiente)',
    example: '2025-09-07T17:45:00.000Z',
  })
  @Expose()
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Fecha de confirmación del pedido',
    example: '2025-09-07T18:10:00.000Z',
  })
  @Expose()
  confirmedAt?: Date;

  @ApiProperty({ example: '2025-09-07T17:30:00.000Z' })
  @Expose()
  createdAt!: Date;
}
