import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { PersonsModule } from './persons/persons.module';
import { CompaniesModule } from './companies/companies.module';
import { UsersModule } from './users/users.module';

import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import appConfig from './config/app.config';
import { softDeletePlugin } from './common/plugins/mongoose/soft-delete.plugin';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { SpeakersModule } from './speakers/speakers.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, jwtConfig, appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
