import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CompanyType } from 'src/common/enums/company-type.enum';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

export type CompanyDocument = HydratedDocument<Company> & {
  _id: Types.ObjectId;
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

@Schema({ _id: false })
export class CompanySettings {
  @Prop({ type: Boolean, default: true }) canUploadSpeakers!: boolean;
  @Prop({ type: Boolean, default: true }) canCreateEvents!: boolean;
  @Prop({ type: Number, min: 0 }) maxEventsPerMonth?: number;
}
export const CompanySettingsSchema =
  SchemaFactory.createForClass(CompanySettings);

@Schema({ _id: false })
export class CompanySubscription {
  @Prop({ type: String, default: 'free' }) plan!: string;
  @Prop({ type: Date }) expiresAt?: Date;
}
export const CompanySubscriptionSchema =
  SchemaFactory.createForClass(CompanySubscription);

@Schema({
  collection: 'companies',
  versionKey: false,
  id: true,
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

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  entityStatus: EntityStatus;

  @Prop({ type: Date })
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy: Types.ObjectId;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ entityStatus: 1, type: 1 });
CompanySchema.index({ name: 'text', description: 'text' });
CompanySchema.index(
  { contactEmail: 1 },
  {
    unique: true,
    partialFilterExpression: { entityStatus: { $ne: EntityStatus.DELETED } },
  },
);
