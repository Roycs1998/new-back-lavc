import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { GeoLocation, GeoLocationSchema } from '../../qr/entities/qr.entity';

export type SponsorStandVisitDocument = SponsorStandVisit & Document;

export enum SponsorStandVisitMode {
  USER_SCANS_SPONSOR = 'USER_SCANS_SPONSOR',
  SPONSOR_SCANS_ATTENDEE = 'SPONSOR_SCANS_ATTENDEE',
}

@Schema({
  collection: 'sponsor_stand_visits',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class SponsorStandVisit {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EventSponsor', required: true })
  eventSponsorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  visitorUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EventParticipant' })
  visitorParticipantId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  scannedByUserId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EventParticipant' })
  scannedByParticipantId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(SponsorStandVisitMode),
    required: true,
  })
  mode!: SponsorStandVisitMode;

  @Prop({ type: Types.ObjectId, ref: 'Ticket' })
  ticketId?: Types.ObjectId;

  @Prop({ type: String })
  deviceInfo?: string;

  @Prop({ type: GeoLocationSchema })
  location?: GeoLocation;

  @Prop({ type: Date, default: Date.now })
  scannedAt!: Date;

  @Prop({ type: Number, default: 1 })
  visitCount!: number;
}

export const SponsorStandVisitSchema =
  SchemaFactory.createForClass(SponsorStandVisit);

SponsorStandVisitSchema.index({ eventSponsorId: 1, visitorUserId: 1 });
SponsorStandVisitSchema.index({ eventSponsorId: 1, scannedAt: -1 });
SponsorStandVisitSchema.index({ eventId: 1, scannedAt: -1 });
