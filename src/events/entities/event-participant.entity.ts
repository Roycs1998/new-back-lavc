import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParticipantType } from '../../common/enums/participant-type.enum';

export type EventParticipantDocument = EventParticipant & Document;

@Schema({
  collection: 'event_participants',
  versionKey: false,
  timestamps: true,
  id: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class EventParticipant {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EventSponsor' })
  eventSponsorId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ParticipantType),
    required: true,
  })
  participantType!: ParticipantType;

  @Prop({ type: Date, default: Date.now })
  registeredAt!: Date;

  @Prop({ type: Types.ObjectId, ref: 'Ticket' })
  ticketId?: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  cancelledBy?: Types.ObjectId;
}

export const EventParticipantSchema =
  SchemaFactory.createForClass(EventParticipant);

EventParticipantSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true,
});

EventParticipantSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

EventParticipantSchema.virtual('sponsor', {
  ref: 'EventSponsor',
  localField: 'eventSponsorId',
  foreignField: '_id',
  justOne: true,
});

EventParticipantSchema.virtual('ticket', {
  ref: 'Ticket',
  localField: 'ticketId',
  foreignField: '_id',
  justOne: true,
});

EventParticipantSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventParticipantSchema.index({ eventSponsorId: 1 });
EventParticipantSchema.index({ participantType: 1 });
EventParticipantSchema.index({ eventId: 1, participantType: 1 });
EventParticipantSchema.index({ eventId: 1, isActive: 1 });
