import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { EventsService } from '../events/events.service';
import { CartItem, CartItemDocument } from './entities/cart-item.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(CartItem.name) private cartItemModel: Model<CartItemDocument>,
    private eventsService: EventsService,
  ) {}

  async addToCart(
    userId: string,
    eventId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartItem[]> {
    const { ticketTypeId, quantity } = addToCartDto;

    const event = await this.eventsService.findOne(eventId);
    if (event.eventStatus !== 'published') {
      throw new BadRequestException(
        'Event is not available for ticket purchase',
      );
    }

    const ticketTypes = await this.eventsService.getEventTicketTypes(eventId);
    const ticketType = ticketTypes.find(
      (tt) => tt.toJSON()._id.toString() === ticketTypeId,
    );

    if (!ticketType) {
      throw new NotFoundException('Ticket type not found');
    }

    const ticketTypeJson = ticketType.toJSON();

    if (ticketTypeJson.available < quantity) {
      throw new BadRequestException(
        `Only ${ticketTypeJson.available} tickets available`,
      );
    }

    const existingCartItem = await this.cartItemModel.findOne({
      userId: new Types.ObjectId(userId),
      ticketTypeId: new Types.ObjectId(ticketTypeId),
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      if (newQuantity > ticketTypeJson.available) {
        throw new BadRequestException(
          `Cannot add ${quantity} more tickets. Only ${ticketTypeJson.available - existingCartItem.quantity} additional tickets available`,
        );
      }

      existingCartItem.quantity = newQuantity;
      await existingCartItem.save();
    } else {
      const cartItem = new this.cartItemModel({
        userId: new Types.ObjectId(userId),
        eventId: new Types.ObjectId(eventId),
        ticketTypeId: new Types.ObjectId(ticketTypeId),
        quantity,
        unitPrice: ticketTypeJson.currentPrice,
        currency: ticketType.currency,
      });

      await cartItem.save();
    }

    return this.getCart(userId);
  }

  async getCart(userId: string): Promise<CartItem[]> {
    return this.cartItemModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'eventId',
        select: 'title startDate endDate location eventStatus',
      })
      .populate({
        path: 'ticketTypeId',
        select: 'name description price currency quantity sold restrictions',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem[]> {
    const cartItem = await this.cartItemModel
      .findOne({
        _id: cartItemId,
        userId: new Types.ObjectId(userId),
      })
      .populate('ticketTypeId');

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    const ticketType = cartItem.ticketTypeId as any;
    if (quantity > ticketType.available + cartItem.quantity) {
      throw new BadRequestException(
        `Only ${ticketType.available + cartItem.quantity} tickets available`,
      );
    }

    if (quantity === 0) {
      await this.cartItemModel.findByIdAndDelete(cartItemId);
    } else {
      cartItem.quantity = quantity;
      await cartItem.save();
    }

    return this.getCart(userId);
  }

  async removeFromCart(
    userId: string,
    cartItemId: string,
  ): Promise<CartItem[]> {
    await this.cartItemModel.findOneAndDelete({
      _id: cartItemId,
      userId: new Types.ObjectId(userId),
    });

    return this.getCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.cartItemModel.deleteMany({
      userId: new Types.ObjectId(userId),
    });
  }

  async getCartSummary(userId: string): Promise<any> {
    const cartItems = await this.getCart(userId);

    const summary = {
      items: cartItems.length,
      subtotal: 0,
      taxAmount: 0,
      serviceFee: 0,
      total: 0,
      currency: 'PEN',
      events: new Set(),
    };

    cartItems.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      summary.subtotal += itemTotal;
      summary.events.add(item.eventId.toString());
    });

    summary.taxAmount = Math.round(summary.subtotal * 0.18 * 100) / 100;

    summary.serviceFee = Math.round(summary.subtotal * 0.03 * 100) / 100;

    summary.total = summary.subtotal + summary.taxAmount + summary.serviceFee;

    return {
      ...summary,
      events: summary.events.size,
    };
  }

  async reserveCartItems(
    userId: string,
    reservationMinutes = 15,
  ): Promise<void> {
    const reservedUntil = new Date();
    reservedUntil.setMinutes(reservedUntil.getMinutes() + reservationMinutes);

    await this.cartItemModel.updateMany(
      { userId: new Types.ObjectId(userId) },
      {
        isReserved: true,
        reservedUntil,
      },
    );
  }

  async releaseReservations(): Promise<void> {
    const now = new Date();
    await this.cartItemModel.updateMany(
      {
        isReserved: true,
        reservedUntil: { $lt: now },
      },
      {
        isReserved: false,
        reservedUntil: undefined,
      },
    );
  }
}
