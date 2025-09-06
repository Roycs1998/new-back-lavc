import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Currency } from 'src/common/enums/currency.enum';

export type CartItemDocument = CartItem & Document;

@Schema({
  collection: 'cart_items',
  versionKey: false,
  id: false,
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event', required: true })
  eventId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TicketType', required: true })
  ticketTypeId: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ type: String, enum: Object.values(Currency), default: 'PEN' })
  currency: Currency;

  @Prop()
  reservedUntil?: Date;

  @Prop({ default: false })
  isReserved: boolean;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

Object.assign(CartItemSchema.options as any, { skipSoftDeletePlugin: true });

CartItemSchema.index({ userId: 1 });
CartItemSchema.index({ reservedUntil: 1 });

CartItemSchema.virtual('totalPrice').get(function () {
  return this.quantity * this.unitPrice;
});
