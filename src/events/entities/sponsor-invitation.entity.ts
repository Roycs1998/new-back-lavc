import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { InvitationUsageType } from '../../common/enums/invitation-usage-type.enum';
import { ParticipantType } from '../../common/enums/participant-type.enum';

export type SponsorInvitationDocument = SponsorInvitation &
  Document<unknown, any, any>;

@Schema({
  collection: 'sponsor_invitations',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class SponsorInvitation {
  @Prop({
    type: Types.ObjectId,
    ref: 'EventSponsor',
    required: true,
    index: true,
  })
  eventSponsorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ type: String, required: true, unique: true, index: true })
  code!: string;

  @Prop({
    type: String,
    enum: Object.values(ParticipantType),
    required: true,
  })
  participantType!: ParticipantType;

  @Prop({ type: Types.ObjectId, ref: 'TicketType' })
  ticketTypeId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(InvitationUsageType),
    required: true,
  })
  usageType!: InvitationUsageType;

  @Prop({ type: Number, default: null })
  maxUses?: number | null;

  @Prop({ type: Number, default: 0 })
  currentUses!: number;

  @Prop({ type: Date, default: null, index: true })
  expiresAt?: Date | null;

  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({
    type: [
      {
        userId: { type: Types.ObjectId, ref: 'User' },
        participantId: { type: Types.ObjectId, ref: 'EventParticipant' },
        usedAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  uses!: Array<{
    userId: Types.ObjectId;
    participantId: Types.ObjectId;
    usedAt: Date;
  }>;

  createdAt!: Date;
  updatedAt!: Date;
}

export const SponsorInvitationSchema =
  SchemaFactory.createForClass(SponsorInvitation);

SponsorInvitationSchema.virtual('eventSponsor', {
  ref: 'EventSponsor',
  localField: 'eventSponsorId',
  foreignField: '_id',
  justOne: true,
});

SponsorInvitationSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true,
});

SponsorInvitationSchema.virtual('ticketType', {
  ref: 'TicketType',
  localField: 'ticketTypeId',
  foreignField: '_id',
  justOne: true,
});

SponsorInvitationSchema.virtual('remainingUses').get(function (this: any) {
  if (this.usageType === InvitationUsageType.UNLIMITED) {
    return null;
  }
  if (this.usageType === InvitationUsageType.SINGLE) {
    return this.currentUses >= 1 ? 0 : 1;
  }
  return Math.max(0, (this.maxUses || 0) - this.currentUses);
});

SponsorInvitationSchema.index({ eventSponsorId: 1, isActive: 1 });
SponsorInvitationSchema.index({ eventId: 1, isActive: 1 });
SponsorInvitationSchema.index({ code: 1 }, { unique: true });
