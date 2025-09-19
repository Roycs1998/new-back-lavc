import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from 'src/common/enums/order-status.enum';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { Currency } from 'src/common/enums/currency.enum';
import { DocumentType } from 'src/common/enums/document-type.enum';

export type OrderDocument = Order & Document;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'TicketType', required: true })
  ticketTypeId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  ticketTypeName!: string;

  @Prop({ type: Number, required: true, min: 1 })
  quantity!: number;

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice!: number;

  @Prop({ type: Number, required: true, min: 0 })
  totalPrice!: number;

  @Prop({ type: String, enum: Object.values(Currency), default: 'PEN' })
  currency!: Currency;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class CustomerInfo {
  @Prop({ type: String, required: true, trim: true })
  firstName!: string;

  @Prop({ type: String, required: true, trim: true })
  lastName!: string;

  @Prop({ type: String, required: true, trim: true })
  email!: string;

  @Prop({ type: String, trim: true })
  phone?: string;

  @Prop({ type: String, enum: DocumentType, required: true })
  documentType!: DocumentType;

  @Prop({ type: String, required: true, trim: true })
  documentNumber!: string;
}
export const CustomerInfoSchema = SchemaFactory.createForClass(CustomerInfo);

@Schema({ _id: false })
export class BillingInfo {
  @Prop({ type: String, trim: true })
  companyName?: string;

  @Prop({ type: String, trim: true })
  ruc?: string;

  @Prop({ type: String, trim: true })
  address?: string;

  @Prop({ type: Boolean, default: false })
  isCompany!: boolean;
}
export const BillingInfoSchema = SchemaFactory.createForClass(BillingInfo);

@Schema({
  collection: 'orders',
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Order {
  @Prop({ required: true, unique: true, index: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({
    type: [OrderItemSchema],
    required: true,
  })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ min: 0, default: 0 })
  discountAmount: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ type: String, enum: Currency, default: Currency.PEN })
  currency: Currency;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.CART,
  })
  status: OrderStatus;

  @Prop({ type: CustomerInfoSchema, required: true })
  customerInfo: CustomerInfo;

  @Prop({ type: BillingInfoSchema })
  billingInfo?: BillingInfo;

  @Prop()
  expiresAt?: Date;

  @Prop()
  confirmedAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true,
});

OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ eventId: 1, status: 1 });
OrderSchema.index({ status: 1, expiresAt: 1 });
OrderSchema.index({ createdAt: -1 });
