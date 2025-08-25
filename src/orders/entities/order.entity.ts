import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../../common/enums/order-status.enum';
import { EntityStatus } from '../../common/enums/entity-status.enum';
import { CurrencyCode } from 'src/common/enums/currency.enum';
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

  @Prop({ type: String, enum: Object.values(CurrencyCode), default: 'PEN' })
  currency!: CurrencyCode;
}
export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
Object.assign(OrderItemSchema.options as any, { skipSoftDeletePlugin: true });

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
Object.assign(CustomerInfoSchema.options as any, {
  skipSoftDeletePlugin: true,
});

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
Object.assign(BillingInfoSchema.options as any, { skipSoftDeletePlugin: true });

@Schema({
  collection: 'orders',
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  versionKey: false,
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
    validate: [
      (v: OrderItem[]) => Array.isArray(v) && v.length > 0,
      'items required',
    ],
  })
  items: OrderItem[];

  @Prop({ required: true, min: 0 })
  subtotal: number;

  @Prop({ min: 0, default: 0 })
  taxAmount: number;

  @Prop({ min: 0, default: 0 })
  discountAmount: number;

  @Prop({ min: 0, default: 0 })
  serviceFee: number;

  @Prop({ required: true, min: 0 })
  total: number;

  @Prop({ type: String, enum: CurrencyCode, default: CurrencyCode.PEN })
  currency: CurrencyCode;

  @Prop({
    type: String,
    enum: OrderStatus,
    default: OrderStatus.CART,
  })
  status: OrderStatus;

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  entityStatus: EntityStatus;

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

Object.assign(OrderSchema.options as any, { skipSoftDeletePlugin: true });

OrderSchema.index({ userId: 1, status: 1 });
OrderSchema.index({ eventId: 1, status: 1 });
OrderSchema.index({ status: 1, expiresAt: 1 });
OrderSchema.index({ createdAt: -1 });
