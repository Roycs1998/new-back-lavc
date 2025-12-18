import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { TicketLifecycleStatus } from 'src/common/enums/ticket-lifecycle-status.enum';
import { Currency } from 'src/common/enums/currency.enum';
import { DocumentType } from 'src/common/enums/document-type.enum';
import { ParticipantType } from 'src/common/enums/participant-type.enum';

export type TicketDocument = Ticket & Document;

@Schema({ _id: false })
export class AttendeeInfo {
  @Prop({ type: String, required: true, trim: true })
  firstName!: string;

  @Prop({ type: String, required: true, trim: true })
  lastName!: string;

  @Prop({ type: String, required: true, trim: true })
  email!: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: String, enum: DocumentType, required: true })
  documentType!: DocumentType;

  @Prop({ type: String, required: true, trim: true })
  documentNumber!: string;
}

export const AttendeeInfoSchema = SchemaFactory.createForClass(AttendeeInfo);

@Schema({
  collection: 'tickets',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Ticket {
  @Prop({ required: true, unique: true, index: true })
  ticketNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: false })
  orderId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TicketType', required: true })
  ticketTypeId: Types.ObjectId;

  @Prop({ required: true })
  ticketTypeName: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ type: String, enum: Currency, default: Currency.PEN })
  currency: Currency;

  @Prop({
    type: String,
    enum: TicketLifecycleStatus,
    default: TicketLifecycleStatus.ACTIVE,
  })
  status: TicketLifecycleStatus;

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  entityStatus: EntityStatus;

  @Prop({
    type: AttendeeInfoSchema,
    required: true,
  })
  attendeeInfo: AttendeeInfo;

  @Prop({ unique: true, index: true })
  qrCode?: string;

  @Prop()
  qrCodeImageUrl?: string;

  @Prop()
  checkedInAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  checkedInBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  transferredTo?: Types.ObjectId;

  @Prop()
  transferredAt?: Date;

  @Prop({ type: String, enum: ['order', 'invitation'], default: 'order' })
  sourceType!: string;

  @Prop({ type: Types.ObjectId, ref: 'EventParticipant' })
  sourceId?: Types.ObjectId;

  @Prop({ type: String, enum: Object.values(ParticipantType) })
  participantType?: ParticipantType;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);

Object.assign(AttendeeInfoSchema.options as any, {
  skipSoftDeletePlugin: true,
});

TicketSchema.index({ orderId: 1 });
TicketSchema.index({ userId: 1, status: 1 });
TicketSchema.index({ eventId: 1, status: 1 });
TicketSchema.index({ sourceType: 1, sourceId: 1 });
