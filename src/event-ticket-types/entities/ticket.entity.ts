import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';
import { Currency } from 'src/common/enums/currency.enum';

export type TicketTypeDocument = TicketType & Document;

@Schema()
class PricingTier {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: Number, required: true, min: 0 })
  price!: number;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;
}

const PricingTierSchema = SchemaFactory.createForClass(PricingTier);

@Schema({ _id: false })
class TicketRestrictions {
  @Prop({ type: Number, default: 1, min: 1 })
  minPerOrder!: number;

  @Prop({ type: Number, default: 10, min: 1 })
  maxPerOrder!: number;

  @Prop({ type: Number, min: 1 })
  maxPerUser?: number;

  @Prop({ type: Boolean, default: false })
  requiresApproval!: boolean;

  @Prop({ type: Boolean, default: true })
  transferable!: boolean;

  @Prop({ type: Boolean, default: false })
  refundable!: boolean;
}
const TicketRestrictionsSchema =
  SchemaFactory.createForClass(TicketRestrictions);

@Schema({ _id: false })
class TicketAccess {
  @Prop({ type: [String], default: [] })
  includesAccess!: string[];

  @Prop({ type: [String], default: [] })
  excludesAccess!: string[];

  @Prop({ type: [String], default: [] })
  perks!: string[];
}
const TicketAccessSchema = SchemaFactory.createForClass(TicketAccess);

@Schema({
  collection: 'ticket_types',
  versionKey: false,
  timestamps: true,
  id: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class TicketType {
  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: Number, required: false, min: 0 })
  price!: number;

  @Prop({ type: String, enum: Currency, default: Currency.PEN })
  currency!: Currency;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, default: 0, min: 0 })
  sold!: number;

  @Prop({
    type: String,
    enum: TicketStatus,
    default: TicketStatus.AVAILABLE,
  })
  ticketStatus!: TicketStatus;

  @Prop({ type: Boolean, default: false })
  isSystem!: boolean;

  @Prop({ type: String, required: false })
  targetRole?: string;

  @Prop({ type: Date })
  saleStartDate?: Date;

  @Prop({ type: Date })
  saleEndDate?: Date;

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
}

export const TicketTypeSchema = SchemaFactory.createForClass(TicketType);

TicketTypeSchema.index({ eventId: 1, ticketStatus: 1 });

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

