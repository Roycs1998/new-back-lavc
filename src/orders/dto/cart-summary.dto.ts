import { ApiProperty } from '@nestjs/swagger';
import { Currency } from 'src/common/enums/currency.enum';

export class CartSummaryDto {
  @ApiProperty({
    description: 'Cantidad de ítems en el carrito',
    example: 3,
  })
  items!: number;

  @ApiProperty({
    description: 'Total a pagar (subtotal + impuesto + cargo)',
    example: 436.8,
  })
  total!: number;

  @ApiProperty({
    description: 'Moneda',
    enum: Currency,
    example: Currency.PEN,
  })
  currency!: Currency;

  @ApiProperty({
    description: 'Número de eventos distintos presentes en el carrito',
    example: 2,
  })
  events!: number;
}
