import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SponsorDocumentSubmissionDocument = SponsorDocumentSubmission &
  Document;

export enum SponsorDocumentStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({
  collection: 'sponsor_document_submissions',
  versionKey: false,
  timestamps: true,
  id: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class SponsorDocumentSubmission {
  @Prop({
    type: Types.ObjectId,
    ref: 'EventDocumentRequirement',
    required: true,
  })
  requirementId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'EventSponsor', required: true })
  eventSponsorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  fileKey!: string;

  @Prop({ type: String, required: true })
  fileUrl!: string;

  @Prop({ type: String })
  fileName?: string;

  @Prop({ type: String })
  fileMimeType?: string;

  @Prop({ type: Number })
  fileSize?: number;

  @Prop({
    type: String,
    enum: SponsorDocumentStatus,
    default: SponsorDocumentStatus.PENDING,
  })
  status!: SponsorDocumentStatus;

  @Prop({ type: String })
  reviewerComment?: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  reviewedBy?: Types.ObjectId;

  @Prop({ type: Date })
  reviewedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  uploadedBy!: Types.ObjectId;
}

export const SponsorDocumentSubmissionSchema = SchemaFactory.createForClass(
  SponsorDocumentSubmission,
);

SponsorDocumentSubmissionSchema.index({
  requirementId: 1,
  eventSponsorId: 1,
});
