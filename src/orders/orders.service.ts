import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from '../common/enums/order-status.enum';
import { EntityStatus } from '../common/enums/entity-status.enum';
import { CartService } from './cart.service';
import { Order, OrderDocument } from './entities/order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private cartService: CartService,
  ) {}

  async createOrderFromCart(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<Order[]> {
    const cartItems = await this.cartService.getCart(userId);
    if (cartItems.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const itemsByEvent = cartItems.reduce((acc, item) => {
      const eventId = item.event.id.toString();
      if (!acc[eventId]) {
        acc[eventId] = [];
      }
      acc[eventId].push(item);
      return acc;
    }, {});

    const orders: Order[] = [];

    for (const [eventId, items] of Object.entries(itemsByEvent)) {
      const order = await this.createSingleOrder(
        userId,
        eventId,
        items as any[],
        createOrderDto,
      );
      orders.push(order);
    }

    await this.cartService.clearCart(userId);

    return orders;
  }

  private async createSingleOrder(
    userId: string,
    eventId: string,
    cartItems: any[],
    createOrderDto: CreateOrderDto,
  ): Promise<Order> {
    const orderNumber = await this.generateOrderNumber();

    let subtotal = 0;
    const orderItems = cartItems.map((item) => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;

      return {
        ticketTypeId: item.ticketTypeId._id,
        ticketTypeName: item.ticketTypeId.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        currency: item.currency,
      };
    });

    const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
    const serviceFee = Math.round(subtotal * 0.03 * 100) / 100;
    const total = subtotal + taxAmount + serviceFee;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const order = new this.orderModel({
      orderNumber,
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),
      items: orderItems,
      subtotal,
      taxAmount,
      serviceFee,
      total,
      currency: 'PEN',
      status: OrderStatus.PENDING_PAYMENT,
      customerInfo: createOrderDto.customerInfo,
      billingInfo: createOrderDto.billingInfo,
      expiresAt,
    });

    return await order.save();
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return this.orderModel
      .find({
        userId: new Types.ObjectId(userId),
        entityStatus: EntityStatus.ACTIVE,
      })
      .populate('eventId', 'title startDate endDate location')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOne(orderId: string, userId?: string): Promise<OrderDocument> {
    const filter: any = { _id: orderId };
    if (userId) {
      filter.userId = new Types.ObjectId(userId);
    }

    const order = await this.orderModel
      .findOne(filter)
      .populate('eventId', 'title startDate endDate location')
      .populate('userId', 'email')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async confirmOrder(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.PAID) {
      throw new BadRequestException('Order must be paid before confirmation');
    }

    order.status = OrderStatus.CONFIRMED;
    order.confirmedAt = new Date();

    return await order.save();
  }

  async cancelOrder(orderId: string, reason?: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if ([OrderStatus.CONFIRMED, OrderStatus.REFUNDED].includes(order.status)) {
      throw new BadRequestException(
        'Cannot cancel confirmed or refunded order',
      );
    }

    order.status = OrderStatus.CANCELLED;

    return await order.save();
  }

  async expireOrder(orderId: string): Promise<Order> {
    const order = await this.findOne(orderId);

    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Only pending payment orders can be expired',
      );
    }

    order.status = OrderStatus.EXPIRED;

    return await order.save();
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<Order> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { status, updatedAt: new Date() },
        { new: true },
      )
      .populate('eventId', 'title startDate endDate')
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const lastOrder = await this.orderModel
      .findOne({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })
      .sort({ createdAt: -1 })
      .exec();

    let sequence = 1;
    if (lastOrder) {
      const lastSequence = parseInt(lastOrder.orderNumber.split('-')[2]);
      sequence = lastSequence + 1;
    }

    return `ORD-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  async cleanupExpiredOrders(): Promise<void> {
    const now = new Date();
    await this.orderModel.updateMany(
      {
        status: OrderStatus.PENDING_PAYMENT,
        expiresAt: { $lt: now },
      },
      {
        status: OrderStatus.EXPIRED,
        updatedAt: now,
      },
    );
  }
}
