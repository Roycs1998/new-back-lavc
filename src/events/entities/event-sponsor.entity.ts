import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EventSponsorDocument = EventSponsor & Document;

@Schema({
  collection: 'event_sponsors',
  versionKey: false,
  timestamps: true,
  id: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class EventSponsor {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId!: Types.ObjectId;

  @Prop({ type: Number, min: 0, default: 0 })
  staffQuota!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  guestQuota!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  scholarshipQuota!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  staffUsed!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  guestUsed!: number;

  @Prop({ type: Number, min: 0, default: 0 })
  scholarshipUsed!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date, default: Date.now })
  assignedAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  assignedBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const EventSponsorSchema = SchemaFactory.createForClass(EventSponsor);

EventSponsorSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true,
});

EventSponsorSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

EventSponsorSchema.virtual('staffAvailable').get(function (this: any) {
  return Math.max(0, this.staffQuota - this.staffUsed);
});

EventSponsorSchema.virtual('guestAvailable').get(function (this: any) {
  return Math.max(0, this.guestQuota - this.guestUsed);
});

EventSponsorSchema.virtual('scholarshipAvailable').get(function (this: any) {
  return Math.max(0, this.scholarshipQuota - this.scholarshipUsed);
});

EventSponsorSchema.index({ eventId: 1, companyId: 1 }, { unique: true });
EventSponsorSchema.index({ eventId: 1, isActive: 1 });
EventSponsorSchema.index({ companyId: 1, isActive: 1 });
EventSponsorSchema.pre('save', function (next) {
  if (this.isModified('staffQuota') && this.staffQuota < this.staffUsed) {
    return next(
      new Error(
        `Cannot reduce staffQuota to ${this.staffQuota}. Already used: ${this.staffUsed}`,
      ),
    );
  }

  if (this.isModified('guestQuota') && this.guestQuota < this.guestUsed) {
    return next(
      new Error(
        `Cannot reduce guestQuota to ${this.guestQuota}. Already used: ${this.guestUsed}`,
      ),
    );
  }

  if (
    this.isModified('scholarshipQuota') &&
    this.scholarshipQuota < this.scholarshipUsed
  ) {
    return next(
      new Error(
        `Cannot reduce scholarshipQuota to ${this.scholarshipQuota}. Already used: ${this.scholarshipUsed}`,
      ),
    );
  }

  next();
});
