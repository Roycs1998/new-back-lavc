import { forwardRef, Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PaymentTransaction,
  PaymentTransactionSchema,
} from './entities/payment.entity';
import { OrdersModule } from 'src/orders/orders.module';
import { TicketsModule } from 'src/tickets/tickets.module';
import { CulqiProvider } from './providers/culqi.provider';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
    ]),
    forwardRef(() => OrdersModule),
    forwardRef(() => TicketsModule),
    EmailModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, CulqiProvider],
  exports: [PaymentsService],
})
export class PaymentsModule {}
