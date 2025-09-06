import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EventStatus } from '../../common/enums/event-status.enum';
import { EventType } from '../../common/enums/event-type.enum';
import { EventLocationType } from 'src/common/enums/event-location-type.enum';
import { AgendaItemType } from 'src/common/enums/agenda-item-type.enum';

export type EventDocument = Event & Document;

@Schema({ _id: false })
class EventAddress {
  @Prop({ trim: true })
  street?: string;

  @Prop({ trim: true, required: true })
  city!: string;

  @Prop({ trim: true })
  state?: string;

  @Prop({ trim: true, required: true })
  country!: string;

  @Prop({ trim: true })
  zipCode?: string;
}
const EventAddressSchema = SchemaFactory.createForClass(EventAddress);

@Schema({ _id: false })
class EventVirtualDetails {
  @Prop({ trim: true })
  platform?: string;

  @Prop({ trim: true })
  meetingUrl?: string;

  @Prop({ trim: true })
  meetingId?: string;

  @Prop({ trim: true })
  passcode?: string;
}
const EventVirtualDetailsSchema =
  SchemaFactory.createForClass(EventVirtualDetails);

@Schema({ _id: false })
class EventLocation {
  @Prop({
    type: String,
    enum: EventLocationType,
    required: true,
  })
  type!: EventLocationType;

  @Prop({ trim: true })
  venue?: string;

  @Prop({ type: EventAddressSchema })
  address?: EventAddress;

  @Prop({ type: EventVirtualDetailsSchema })
  virtualDetails?: EventVirtualDetails;

  @Prop({ type: Number, min: 1 })
  capacity?: number;
}
const EventLocationSchema = SchemaFactory.createForClass(EventLocation);

@Schema({ _id: true })
class EventAgendaItem {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ type: Date, required: true })
  startTime!: Date;

  @Prop({ type: Date, required: true })
  endTime!: Date;

  @Prop({ type: Types.ObjectId, ref: 'Speaker' })
  speakerId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: AgendaItemType,
    default: AgendaItemType.PRESENTATION,
  })
  type!: AgendaItemType;
}
const EventAgendaItemSchema = SchemaFactory.createForClass(EventAgendaItem);

@Schema({ _id: false })
class EventRegistration {
  @Prop({ type: Boolean, default: true })
  isOpen!: boolean;

  @Prop({ type: Date })
  opensAt?: Date;

  @Prop({ type: Date })
  closesAt?: Date;

  @Prop({ type: Boolean, default: false })
  requiresApproval!: boolean;

  @Prop({ type: Number, default: 1, min: 1 })
  maxAttendeesPerRegistration!: number;

  @Prop({ type: Boolean, default: false })
  waitlistEnabled!: boolean;
}

const EventRegistrationSchema = SchemaFactory.createForClass(EventRegistration);

@Schema({ _id: false })
class EventSettings {
  @Prop({ type: Boolean, default: false })
  isPrivate!: boolean;

  @Prop({ type: Boolean, default: false })
  requiresInvitation!: boolean;

  @Prop({ type: Number, min: 0 })
  ageRestriction?: number;

  @Prop({ type: String, trim: true })
  dresscode?: string;

  @Prop({ type: String, trim: true })
  specialInstructions?: string;
}
const EventSettingsSchema = SchemaFactory.createForClass(EventSettings);

@Schema({
  collection: 'events',
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  timestamps: true,
})
export class Event {
  @Prop({ type: String, required: true, trim: true })
  title!: string;

  @Prop({ type: String, required: false, trim: true })
  description?: string;

  @Prop({ type: String, trim: true })
  shortDescription?: string;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId!: Types.ObjectId;

  @Prop({ type: String, enum: EventType, required: true })
  type!: EventType;

  @Prop({
    type: String,
    enum: EventStatus,
    default: EventStatus.DRAFT,
  })
  eventStatus!: EventStatus;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ type: String, trim: true })
  timezone?: string;

  @Prop({ type: Boolean, default: false })
  isAllDay!: boolean;

  @Prop({ type: EventLocationSchema, required: true })
  location!: EventLocation;

  @Prop({ type: [Types.ObjectId], ref: 'Speaker', default: [] })
  speakers!: Types.ObjectId[];

  @Prop({ type: [EventAgendaItemSchema], default: [] })
  agenda?: EventAgendaItem[];

  @Prop({ type: EventRegistrationSchema, default: {} })
  registration!: EventRegistration;

  @Prop({ type: String, trim: true })
  featuredImage?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ type: String, trim: true })
  videoUrl?: string;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: [String], default: [] })
  categories?: string[];

  @Prop({ type: String, trim: true })
  slug?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;

  @Prop({ type: String, trim: true })
  rejectionReason?: string;

  @Prop({ type: EventSettingsSchema, default: {} })
  settings!: EventSettings;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

EventSchema.index({ companyId: 1, slug: 1 }, { unique: true, sparse: true });
EventSchema.index({ companyId: 1, eventStatus: 1 });
EventSchema.index({ startDate: 1, eventStatus: 1 });
EventSchema.index({ 'location.address.city': 1, startDate: 1 });
EventSchema.index({ type: 1, eventStatus: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ categories: 1 });
EventSchema.index({ 'settings.isPrivate': 1 });
EventSchema.index({ 'settings.requiresInvitation': 1 });

EventSchema.pre('validate', function (next) {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    return next(
      new Error('endDate must be greater than or equal to startDate'),
    );
  }

  if (this.registration?.opensAt && this.registration?.closesAt) {
    if (this.registration.opensAt > this.registration.closesAt) {
      return next(
        new Error('registration.opensAt must be before registration.closesAt'),
      );
    }
  }
  if (
    this.registration?.opensAt &&
    this.startDate &&
    this.registration.opensAt > this.startDate
  ) {
    return next(new Error('registration.opensAt must be before startDate'));
  }
  if (
    this.registration?.closesAt &&
    this.startDate &&
    this.registration.closesAt > this.startDate
  ) {
    return next(new Error('registration.closesAt must be before startDate'));
  }

  const loc = this.location as EventLocation;
  if (
    loc?.type === EventLocationType.PHYSICAL ||
    loc?.type === EventLocationType.HYBRID
  ) {
    if (!loc.address?.city || !loc.address?.country) {
      return next(
        new Error(
          'location.address.city and location.address.country are required for physical/hybrid',
        ),
      );
    }
  }
  if (
    loc?.type === EventLocationType.VIRTUAL ||
    loc?.type === EventLocationType.HYBRID
  ) {
    if (!loc.virtualDetails?.meetingUrl) {
      return next(
        new Error(
          'location.virtualDetails.meetingUrl is required for virtual/hybrid',
        ),
      );
    }
  }

  next();
});
