import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from 'src/common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @ApiProperty({
    description: 'Nuevo estado del pedido',
    enum: OrderStatus,
    example: OrderStatus.PAID,
  })
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
