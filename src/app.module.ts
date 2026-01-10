import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { PersonsModule } from './persons/persons.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';

import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { softDeletePlugin } from './common/plugins/mongoose/soft-delete.plugin';

import { AuthModule } from './auth/auth.module';
import { SpeakersModule } from './speakers/speakers.module';
import { EventsModule } from './events/events.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { TicketsModule } from './tickets/tickets.module';
import { QRModule } from './qr/qr.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentMethodsModule } from './payment-methods/payment-methods.module';
import { EmailModule } from './email/email.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
        connectionFactory: (connection) => {
          connection.plugin(softDeletePlugin);

          return connection;
        },
        ...configService.get('database.options'),
      }),
      inject: [ConfigService],
    }),
    PersonsModule,
    CompaniesModule,
    UsersModule,
    AuthModule,
    SpeakersModule,
    EventsModule,
    OrdersModule,
    PaymentsModule,
    TicketsModule,
    QRModule,
    AnalyticsModule,
    PaymentMethodsModule,
    EmailModule,
    StorageModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
