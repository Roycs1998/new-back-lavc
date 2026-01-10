import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { Ticket, TicketSchema } from './entities/ticket.entity';
import { OrdersModule } from '../orders/orders.module';
import { EventsModule } from '../events/events.module';
import { UsersModule } from '../users/users.module';
import { QRModule } from '../qr/qr.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
    forwardRef(() => OrdersModule),
    forwardRef(() => EventsModule),
    forwardRef(() => UsersModule),
    QRModule,
  ],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService, MongooseModule],
})
export class TicketsModule {}
