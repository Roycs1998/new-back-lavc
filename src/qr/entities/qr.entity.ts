import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntryStatus } from '../../common/enums/entry-status.enum';

export type EntryLogDocument = EntryLog & Document;

@Schema({ _id: false })
export class GeoLocation {
  @Prop({ type: Number, min: -90, max: 90, required: true })
  latitude!: number;

  @Prop({ type: Number, min: -180, max: 180, required: true })
  longitude!: number;
}
export const GeoLocationSchema = SchemaFactory.createForClass(GeoLocation);

@Schema({
  collection: 'entry_logs',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class EntryLog {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Ticket', required: true })
  ticketId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  attendeeId?: Types.ObjectId;

  @Prop({ type: String, enum: EntryStatus, required: true })
  status!: EntryStatus;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  validatedBy!: Types.ObjectId;

  @Prop({ type: String })
  validationNotes?: string;

  @Prop({ type: String })
  deviceInfo?: string;

  @Prop({ type: String })
  ipAddress?: string;

  @Prop({ type: GeoLocationSchema })
  location?: GeoLocation;

  @Prop({ type: Date, required: true })
  validatedAt!: Date;

  @Prop({ type: String })
  qrDataHash?: string;
}

export const EntryLogSchema = SchemaFactory.createForClass(EntryLog);

EntryLogSchema.index({ eventId: 1 });
EntryLogSchema.index({ ticketId: 1 });
EntryLogSchema.index({ validatedAt: 1 });
EntryLogSchema.index({ status: 1 });
