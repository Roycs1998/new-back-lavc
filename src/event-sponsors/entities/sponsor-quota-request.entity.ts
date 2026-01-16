import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ParticipantType } from '../../common/enums/participant-type.enum';

export type SponsorQuotaRequestDocument = SponsorQuotaRequest & Document;

export enum QuotaRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Schema({
  collection: 'sponsor_quota_requests',
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class SponsorQuotaRequest {
  @Prop({ type: Types.ObjectId, ref: 'EventSponsor', required: true })
  eventSponsorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  requestedBy!: Types.ObjectId;

  @Prop({ type: String, enum: ParticipantType, required: true })
  type!: ParticipantType;

  @Prop({ type: Number, required: true, min: 1 })
  requestedAmount!: number;

  @Prop({ type: String, required: true })
  reason!: string;

  @Prop({
    type: String,
    enum: QuotaRequestStatus,
    default: QuotaRequestStatus.PENDING,
  })
  status!: QuotaRequestStatus;

  @Prop({ type: Number })
  approvedAmount?: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: String })
  rejectionReason?: string;
}

export const SponsorQuotaRequestSchema =
  SchemaFactory.createForClass(SponsorQuotaRequest);

SponsorQuotaRequestSchema.virtual('eventSponsor', {
  ref: 'EventSponsor',
  localField: 'eventSponsorId',
  foreignField: '_id',
  justOne: true,
});

SponsorQuotaRequestSchema.virtual('requester', {
  ref: 'User',
  localField: 'requestedBy',
  foreignField: '_id',
  justOne: true,
});

SponsorQuotaRequestSchema.virtual('reviewer', {
  ref: 'User',
  localField: 'reviewedBy',
  foreignField: '_id',
  justOne: true,
});
