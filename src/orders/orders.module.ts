import { forwardRef, Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './entities/order.entity';
import { CartItem, CartItemSchema } from './entities/cart-item.entity';
import { EventsModule } from 'src/events/events.module';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { EventTicketTypesModule } from 'src/event-ticket-types/event-ticket-types.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: CartItem.name, schema: CartItemSchema },
    ]),
    forwardRef(() => EventsModule),
    EventTicketTypesModule,
  ],
  controllers: [OrdersController, CartController],
  providers: [OrdersService, CartService],
  exports: [OrdersService, CartService],
})
export class OrdersModule {}
