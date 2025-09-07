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
import { CartSummaryDto } from './dto/cart-summary.dto';
import { Currency } from 'src/common/enums/currency.enum';
import { CartItemDto } from './dto/cart-item.dto';
import { toDto } from 'src/utils/toDto';

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
  ): Promise<CartItemDto[]> {
    const { ticketTypeId, quantity } = addToCartDto;

    const event = await this.eventsService.findOne(eventId);
    if (event.eventStatus !== 'published') {
      throw new BadRequestException(
        'El evento no está disponible para la compra de entradas.',
      );
    }

    const ticketTypes = await this.eventsService.getEventTicketTypes(eventId);

    const ticketType = ticketTypes.find((tt) => tt.id === ticketTypeId);

    if (!ticketType) {
      throw new NotFoundException('No se ha encontrado el tipo de entrada.');
    }

    if (ticketType.available < quantity) {
      throw new BadRequestException(
        `Solo quedan ${ticketType.available} entradas disponibles.`,
      );
    }

    const existingCartItem = await this.cartItemModel.findOne({
      userId: new Types.ObjectId(userId),
      ticketTypeId: new Types.ObjectId(ticketTypeId),
    });

    if (existingCartItem) {
      const newQuantity = existingCartItem.quantity + quantity;
      if (newQuantity > ticketType.available) {
        throw new BadRequestException(
          `No se pueden añadir más entradas. Solo hay disponibles ${ticketType.available - existingCartItem.quantity} entradas adicionales.`,
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
        unitPrice: ticketType.currentPrice,
        currency: ticketType.currency,
      });

      await cartItem.save();
    }

    return this.getCart(userId);
  }

  async getCart(userId: string): Promise<CartItemDto[]> {
    const cart = await this.cartItemModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'event',
      })
      .populate({
        path: 'ticketType',
      })
      .sort({ createdAt: -1 })
      .exec();

    return cart.map((c) => toDto(c, CartItemDto));
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItemDto[]> {
    const cartItem = await this.cartItemModel
      .findOne({
        _id: cartItemId,
        userId: new Types.ObjectId(userId),
      })
      .populate('ticketTypeId');

    if (!cartItem) {
      throw new NotFoundException('Artículo del carrito no encontrado');
    }

    const ticketType = cartItem.ticketTypeId as any;
    if (quantity > ticketType.available + cartItem.quantity) {
      throw new BadRequestException(
        `Solo hay {ticketType.available + cartItem.quantity} entradas disponibles.`,
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
  ): Promise<CartItemDto[]> {
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

  async getCartSummary(userId: string): Promise<CartSummaryDto> {
    const cartItems = await this.getCart(userId);

    const summary = {
      items: cartItems.length,
      total: 0,
      currency: Currency.PEN,
      events: new Set(),
    };

    cartItems.forEach((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      summary.total += itemTotal;
      summary.events.add(item.event.id.toString());
    });

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
