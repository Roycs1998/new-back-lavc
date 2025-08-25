import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QRController } from './qr.controller';
import { QRService } from './qr.service';
import { EntryLog, EntryLogSchema } from './entities/qr.entity';
import { Ticket, TicketSchema } from 'src/tickets/entities/ticket.entity';
import { EventSchema } from 'src/events/entities/event.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EntryLog.name, schema: EntryLogSchema },
      { name: Ticket.name, schema: TicketSchema },
      { name: Event.name, schema: EventSchema },
    ]),
  ],
  controllers: [QRController],
  providers: [QRService],
  exports: [QRService],
})
export class QRModule {}
