import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus } from '../../common/enums/ticket-status.enum';

export type TicketTypeDocument = TicketType & Document;

@Schema({ _id: false })
class PricingTier {
  @Prop({ type: String, required: true, trim: true }) name!: string;
  @Prop({ type: Number, required: true, min: 0 }) price!: number;
  @Prop({ type: Date, required: true }) startDate!: Date;
  @Prop({ type: Date, required: true }) endDate!: Date;
  @Prop({ type: Boolean, default: true }) isActive!: boolean;
}
const PricingTierSchema = SchemaFactory.createForClass(PricingTier);
Object.assign(PricingTierSchema.options as any, { skipSoftDeletePlugin: true });

@Schema({ _id: false })
class TicketRestrictions {
  @Prop({ type: Number, default: 1, min: 1 }) minPerOrder!: number;
  @Prop({ type: Number, default: 10, min: 1 }) maxPerOrder!: number;
  @Prop({ type: Number, min: 1 }) maxPerUser?: number;
  @Prop({ type: Boolean, default: false }) requiresApproval!: boolean;
  @Prop({ type: Boolean, default: true }) transferable!: boolean;
  @Prop({ type: Boolean, default: false }) refundable!: boolean;
}
const TicketRestrictionsSchema =
  SchemaFactory.createForClass(TicketRestrictions);
Object.assign(TicketRestrictionsSchema.options as any, {
  skipSoftDeletePlugin: true,
});

@Schema({ _id: false })
class TicketAccess {
  @Prop({ type: [String], default: [] }) includesAccess!: string[];
  @Prop({ type: [String], default: [] }) excludesAccess!: string[];
  @Prop({ type: [String], default: [] }) perks!: string[];
}
const TicketAccessSchema = SchemaFactory.createForClass(TicketAccess);
Object.assign(TicketAccessSchema.options as any, {
  skipSoftDeletePlugin: true,
});

@Schema({
  collection: 'ticket_types',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.status;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class TicketType {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true, index: true })
  eventId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: String, enum: ['PEN', 'USD', 'EUR'], default: 'PEN' })
  currency!: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  sold!: number;

  @Prop({
    type: String,
    enum: TicketStatus,
    default: TicketStatus.AVAILABLE,
    index: true,
  })
  ticketStatus!: TicketStatus;

  @Prop({ type: Date }) saleStartDate?: Date;
  @Prop({ type: Date }) saleEndDate?: Date;

  @Prop({ type: [PricingTierSchema], default: [] })
  pricingTiers?: PricingTier[];

  @Prop({ type: TicketRestrictionsSchema, default: {} })
  restrictions!: TicketRestrictions;

  @Prop({ type: TicketAccessSchema, default: {} })
  access!: TicketAccess;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;

  @Prop() createdAt!: Date;
  @Prop() updatedAt!: Date;
}

export const TicketTypeSchema = SchemaFactory.createForClass(TicketType);

Object.assign(TicketTypeSchema.options as any, { skipSoftDeletePlugin: true });

TicketTypeSchema.index({ eventId: 1, ticketStatus: 1 });
TicketTypeSchema.index({ eventId: 1, status: 1 });

TicketTypeSchema.virtual('available').get(function (this: any) {
  return Math.max(0, this.quantity - this.sold);
});

TicketTypeSchema.virtual('currentPrice').get(function (this: any) {
  const tiers = this.pricingTiers as PricingTier[] | undefined;
  if (!tiers || tiers.length === 0) return this.price;
  const now = new Date();
  const active = tiers.find(
    (t) => t.isActive && t.startDate <= now && t.endDate >= now,
  );
  return active ? active.price : this.price;
});
