import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentStatus } from 'src/common/enums/payment-status.enum';
import { PaymentMethod } from 'src/common/enums/payment-method.enum';
import { RefundReason } from 'src/common/enums/refund-reason.enum';
import { Currency } from 'src/common/enums/currency.enum';

export type PaymentTransactionDocument = PaymentTransaction & Document;

@Schema({ _id: false })
export class CardInfo {
  @Prop({ type: String, trim: true })
  last4?: string;

  @Prop({ type: String, trim: true })
  brand?: string;

  @Prop({ type: String, trim: true })
  expiryMonth?: string;

  @Prop({ type: String, trim: true })
  expiryYear?: string;

  @Prop({ type: String, trim: true })
  holderName?: string;
}
export const CardInfoSchema = SchemaFactory.createForClass(CardInfo);

@Schema({
  collection: 'payment_transactions',
  versionKey: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
})
export class PaymentTransaction {
  @Prop({ unique: true, index: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop({ type: String, enum: Currency, default: Currency.PEN })
  currency: Currency;

  @Prop({
    type: String,
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Prop({
    type: String,
    enum: PaymentMethod,
    required: true,
  })
  paymentMethod: PaymentMethod;

  @Prop({ default: 'culqi' })
  paymentProvider: string;

  @Prop()
  providerTransactionId?: string;

  @Prop({ type: Object })
  providerResponse?: any;

  @Prop({
    type: CardInfoSchema,
    required: false,
  })
  cardInfo?: CardInfo;

  @Prop()
  processedAt?: Date;

  @Prop()
  failedAt?: Date;

  @Prop()
  refundedAt?: Date;

  @Prop({ trim: true })
  failureReason?: string;

  @Prop({
    type: String,
    enum: RefundReason,
  })
  refundReason?: RefundReason;

  @Prop({ min: 0 })
  refundAmount?: number;

  @Prop({ min: 0 })
  platformFee?: number;

  @Prop({ min: 0 })
  paymentProviderFee?: number;
}

export const PaymentTransactionSchema =
  SchemaFactory.createForClass(PaymentTransaction);

PaymentTransactionSchema.index({ orderId: 1 });
PaymentTransactionSchema.index({ userId: 1, status: 1 });
PaymentTransactionSchema.index({ status: 1, createdAt: -1 });
PaymentTransactionSchema.index({
  paymentProvider: 1,
  providerTransactionId: 1,
});
