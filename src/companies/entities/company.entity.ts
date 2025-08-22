import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CompanyType } from 'src/common/enums/company-type.enum';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

export type CompanyDocument = HydratedDocument<Company> & {
  _id: Types.ObjectId;
  status: EntityStatus;
};

@Schema({ _id: false })
export class Address {
  @Prop({ trim: true }) street?: string;
  @Prop({ trim: true, required: true }) city!: string;
  @Prop({ trim: true }) state?: string;
  @Prop({ trim: true, required: true }) country!: string;
  @Prop({ trim: true }) zipCode?: string;
}
export const AddressSchema = SchemaFactory.createForClass(Address);

Object.assign(AddressSchema.options as any, { skipSoftDeletePlugin: true });

@Schema({ _id: false })
export class CompanySettings {
  @Prop({ type: Boolean, default: true }) canUploadSpeakers!: boolean;
  @Prop({ type: Boolean, default: true }) canCreateEvents!: boolean;
  @Prop({ type: Number, min: 0 }) maxEventsPerMonth?: number;
}
export const CompanySettingsSchema =
  SchemaFactory.createForClass(CompanySettings);
Object.assign(CompanySettingsSchema.options as any, {
  skipSoftDeletePlugin: true,
});

@Schema({ _id: false })
export class CompanySubscription {
  @Prop({ type: String, default: 'free' }) plan!: string;
  @Prop({ type: Date }) expiresAt?: Date;
}
export const CompanySubscriptionSchema =
  SchemaFactory.createForClass(CompanySubscription);
Object.assign(CompanySubscriptionSchema.options as any, {
  skipSoftDeletePlugin: true,
});

@Schema({
  collection: 'companies',
  versionKey: false,
  id: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Company {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description?: string;

  @Prop({ trim: true })
  logo?: string;

  @Prop({ trim: true })
  website?: string;

  @Prop({ required: true, trim: true, lowercase: true })
  contactEmail: string;

  @Prop({ trim: true })
  contactPhone?: string;

  @Prop({
    type: AddressSchema,
  })
  address?: Address;

  @Prop({
    type: String,
    enum: CompanyType,
    default: CompanyType.EVENT_ORGANIZER,
  })
  type: CompanyType;

  @Prop({ min: 0, max: 1, default: 0 })
  commissionRate: number;

  @Prop({
    type: CompanySettingsSchema,
    default: () => ({
      canUploadSpeakers: true,
      canCreateEvents: true,
    }),
  })
  settings: CompanySettings;

  @Prop({
    type: CompanySubscriptionSchema,
  })
  subscription?: CompanySubscription;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId;

  @Prop()
  approvedAt?: Date;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ status: 1, type: 1 });
CompanySchema.index({ name: 'text', description: 'text' });
CompanySchema.index(
  { contactEmail: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: EntityStatus.DELETED } },
  },
);
