import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

export type SpeakerDocument = Speaker &
  Document & { _id: Types.ObjectId; status: EntityStatus };

export type UploadSource = 'manual' | 'excel' | 'csv' | 'bulk_import';
export type Status = 'active' | 'inactive' | 'deleted';

@Schema({ _id: false })
class SocialMedia {
  @Prop({ type: String, trim: true, match: /^https?:\/\// }) linkedin?: string;
  @Prop({ type: String, trim: true, match: /^https?:\/\// }) twitter?: string;
  @Prop({ type: String, trim: true, match: /^https?:\/\// }) website?: string;
  @Prop({ type: String, trim: true, match: /^https?:\/\// }) github?: string;
}
const SocialMediaSchema = SchemaFactory.createForClass(SocialMedia);
Object.assign(SocialMediaSchema.options as any, { skipSoftDeletePlugin: true });

@Schema({ _id: false })
class AudienceSize {
  @Prop({ type: Number, min: 0 }) min?: number;
  @Prop({ type: Number, min: 0 }) max?: number;
}
const AudienceSizeSchema = SchemaFactory.createForClass(AudienceSize);
Object.assign(AudienceSizeSchema.options as any, {
  skipSoftDeletePlugin: true,
});

AudienceSizeSchema.pre('validate', function (next) {
  const self = this as any as AudienceSize;
  if (self.min != null && self.max != null && self.min > self.max) {
    return next(
      new Error(
        'audienceSize.min must be less than or equal to audienceSize.max',
      ),
    );
  }
  next();
});

@Schema({
  collection: 'speakers',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class Speaker {
  @Prop({ type: Types.ObjectId, ref: 'Person', required: true })
  personId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  specialty: string;

  @Prop({ trim: true })
  biography?: string;

  @Prop({ required: true, min: 0, max: 50 })
  yearsExperience: number;

  @Prop({
    type: [String],
    default: [],
    set: (vals: string[]) =>
      Array.isArray(vals)
        ? vals.map((v) => String(v).trim()).filter(Boolean)
        : [],
  })
  certifications?: string[];

  @Prop({ min: 0, max: 10000 })
  hourlyRate?: number;

  @Prop({ type: String, enum: ['USD', 'PEN', 'EUR'], default: 'PEN' })
  currency?: string;

  @Prop({
    type: SocialMediaSchema,
  })
  socialMedia?: SocialMedia;

  @Prop({
    type: String,
    enum: ['manual', 'excel', 'csv', 'bulk_import'],
    default: 'manual',
  })
  uploadedVia: UploadSource;

  @Prop({ default: false })
  canEdit: boolean;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  editableBy: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop({
    type: [String],
    default: [],
    set: (vals: string[]) =>
      Array.isArray(vals)
        ? vals.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
        : [],
  })
  languages?: string[];

  @Prop({
    type: [String],
    default: [],
    set: (vals: string[]) =>
      Array.isArray(vals)
        ? vals.map((v) => String(v).trim().toLowerCase()).filter(Boolean)
        : [],
  })
  topics?: string[];

  @Prop({
    type: AudienceSizeSchema,
  })
  audienceSize?: AudienceSize;

  @Prop({ trim: true })
  notes?: string;
}

export const SpeakerSchema = SchemaFactory.createForClass(Speaker);

SpeakerSchema.index({ personId: 1 });
SpeakerSchema.index({ companyId: 1, status: 1 });
SpeakerSchema.index({ specialty: 1, status: 1 });
SpeakerSchema.index({ uploadedVia: 1 });
SpeakerSchema.index({ createdBy: 1 });
SpeakerSchema.index(
  { specialty: 'text', biography: 'text', topics: 'text' },
  { weights: { specialty: 3, topics: 2, biography: 1 } },
);
