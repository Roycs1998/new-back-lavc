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
import { EventSchema } from 'src/events/entities/event.entity';
import { EventsModule } from 'src/events/events.module';
import { CompaniesModule } from 'src/companies/companies.module';
import {
  PaymentMethod,
  PaymentMethodSchema,
} from 'src/payment-methods/entities/payment-method.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PaymentTransaction.name, schema: PaymentTransactionSchema },
      { name: PaymentMethod.name, schema: PaymentMethodSchema }, // ✅ NUEVO
    ]),
    forwardRef(() => OrdersModule),
    forwardRef(() => TicketsModule),
    EmailModule,
    EventsModule,
    CompaniesModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, CulqiProvider],
  exports: [PaymentsService],
})
export class PaymentsModule { }
