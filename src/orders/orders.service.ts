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
import { OrderDto } from './dto/order.dto';
import { toDto } from 'src/utils/toDto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private cartService: CartService,
  ) { }

  async createOrderFromCart(
    userId: string,
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDto[]> {
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

    const orders: OrderDocument[] = [];

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

    return orders.map((o) => toDto(o, OrderDto));
  }

  private async createSingleOrder(
    userId: string,
    eventId: string,
    cartItems: any[],
    createOrderDto: CreateOrderDto,
  ): Promise<OrderDocument> {
    const orderNumber = await this.generateOrderNumber();

    const currencies = new Set<string>(
      cartItems.map((it) => String(it.currency)),
    );
    if (currencies.size > 1) {
      throw new BadRequestException(
        'Todos los artículos de un pedido deben compartir la misma moneda',
      );
    }

    const currency = (cartItems[0]?.currency as string) ?? 'PEN';

    let subtotal = 0;

    const orderItems = cartItems.map((item) => {
      // ⭐ FIX: En CartItemDto, ticketType es un objeto con { id, name, ... }
      // No es una referencia de MongoDB como en el documento raw
      const ticketTypeId = item.ticketType?.id;
      const ticketTypeName = item.ticketType?.name;

      if (!ticketTypeId || !ticketTypeName) {
        throw new BadRequestException(
          'Artículo de carrito no válido: faltan datos del tipo de ticket',
        );
      }

      const itemTotal = Number(item.quantity) * Number(item.unitPrice);
      subtotal += itemTotal;

      return {
        ticketTypeId: new Types.ObjectId(ticketTypeId),
        ticketTypeName,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: itemTotal,
        currency,
      };
    });

    const total = subtotal;

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 👇 Validamos y convertimos el paymentMethodId
    if (!createOrderDto.paymentMethodId) {
      throw new BadRequestException('paymentMethodId is required');
    }

    const created = await this.orderModel.create({
      orderNumber,
      userId: new Types.ObjectId(userId),
      eventId: new Types.ObjectId(eventId),

      // ✨ AQUÍ ES DONDE METEMOS EL CAMPO NUEVO
      paymentMethodId: new Types.ObjectId(createOrderDto.paymentMethodId),

      items: orderItems,
      subtotal,
      discountAmount: 0,
      total,
      currency,
      status: OrderStatus.PENDING_PAYMENT,
      customerInfo: createOrderDto.customerInfo,
      billingInfo: createOrderDto.billingInfo,
      expiresAt,
      entityStatus: EntityStatus.ACTIVE,
    });

    const order = await this.orderModel.findById(created._id).populate('event');

    if (!order) {
      throw new NotFoundException('Orden no encontrada');
    }

    return order;
  }

  async findUserOrders(userId: string): Promise<OrderDto[]> {
    const docs = await this.orderModel
      .find({
        userId: new Types.ObjectId(userId),
        entityStatus: EntityStatus.ACTIVE,
      })
      .populate('event')
      .sort({ createdAt: -1 })
      .exec();

    return docs.map((d) => toDto(d, OrderDto));
  }

  async findOne(orderId: string, userId?: string): Promise<OrderDto> {
    const filter: any = { _id: orderId };
    if (userId) filter.userId = new Types.ObjectId(userId);

    const order = await this.orderModel
      .findOne(filter)
      .populate('event')
      .exec();

    if (!order) throw new NotFoundException('Orden no encontrada');
    return toDto(order, OrderDto);
  }

  async confirmOrder(orderId: string): Promise<OrderDto> {
    const orderDoc = await this.orderModel
      .findById(orderId)
      .populate('event')
      .exec();
    if (!orderDoc) throw new NotFoundException('Orden no encontrada');

    if (orderDoc.status !== OrderStatus.PAID) {
      throw new BadRequestException(
        'El pedido debe pagarse antes de la confirmación.',
      );
    }

    orderDoc.status = OrderStatus.CONFIRMED;
    orderDoc.confirmedAt = new Date();
    await orderDoc.save();

    return toDto(orderDoc, OrderDto);
  }

  async cancelOrder(orderId: string): Promise<OrderDto> {
    const orderDoc = await this.orderModel
      .findById(orderId)
      .populate('event')
      .exec();
    if (!orderDoc) throw new NotFoundException('Orden no encontrada');

    if (
      orderDoc.status === OrderStatus.CONFIRMED ||
      orderDoc.status === OrderStatus.REFUNDED
    ) {
      throw new BadRequestException(
        'No se puede cancelar un pedido confirmado o reembolsado',
      );
    }

    orderDoc.status = OrderStatus.CANCELLED;
    await orderDoc.save();

    return toDto(orderDoc, OrderDto);
  }

  async expireOrder(orderId: string): Promise<OrderDto> {
    const orderDoc = await this.orderModel
      .findById(orderId)
      .populate('event')
      .exec();
    if (!orderDoc) throw new NotFoundException('Orden no encontrada');

    if (orderDoc.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException(
        'Sólo se podrán caducar las órdenes de pago pendientes',
      );
    }

    orderDoc.status = OrderStatus.EXPIRED;
    await orderDoc.save();

    return toDto(orderDoc, OrderDto);
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderDto> {
    const order = await this.orderModel
      .findByIdAndUpdate(
        orderId,
        { status, updatedAt: new Date() },
        { new: true, runValidators: true, context: 'query' },
      )
      .populate('event')
      .exec();

    if (!order) throw new NotFoundException('Orden no encontrada');
    return toDto(order, OrderDto);
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
