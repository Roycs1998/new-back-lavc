import { forwardRef, Module } from '@nestjs/common';
import { SpeakersService } from './speakers.service';
import { SpeakersController } from './speakers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Speaker, SpeakerSchema } from './entities/speaker.entity';
import { CompaniesModule } from 'src/companies/companies.module';
import { UsersModule } from 'src/users/users.module';
import { StorageModule } from 'src/storage/storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Speaker.name, schema: SpeakerSchema }]),
    forwardRef(() => CompaniesModule),
    forwardRef(() => UsersModule),
    StorageModule,
  ],
  controllers: [SpeakersController],
  providers: [SpeakersService],
  exports: [SpeakersService],
})
export class SpeakersModule {}
