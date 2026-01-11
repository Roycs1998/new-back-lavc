import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { PaymentMethod } from '../common/enums/payment-method.enum';
import { OrderStatus } from '../common/enums/order-status.enum';
import { RefundReason } from '../common/enums/refund-reason.enum';
import { OrdersService } from '../orders/orders.service';
import { TicketsService } from '../tickets/tickets.service';
import { CulqiProvider } from './providers/culqi.provider';
import { PaymentProvider } from './interface/payment-provider.interface';
import {
  PaymentTransaction,
  PaymentTransactionDocument,
} from './entities/payment.entity';
import { EmailService } from 'src/email/email.service';
import { Event, EventDocument } from '../events/entities/event.entity';
import { Company, CompanyDocument } from '../companies/entities/company.entity';
import {
  PaymentMethod as PaymentMethodEntity,
  PaymentMethodDocument,
} from '../payment-methods/entities/payment-method.entity';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private paymentProviders: Map<string, PaymentProvider> = new Map();

  constructor(
    @InjectModel(PaymentTransaction.name)
    private paymentTransactionModel: Model<PaymentTransactionDocument>,

    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,

    @InjectModel(Company.name)
    private companyModel: Model<CompanyDocument>,

    @InjectModel(PaymentMethodEntity.name)
    private paymentMethodModel: Model<PaymentMethodDocument>,

    @Inject(forwardRef(() => OrdersService))
    private ordersService: OrdersService,
    @Inject(forwardRef(() => TicketsService))
    private ticketsService: TicketsService,
    private readonly emailService: EmailService,
    private culqiProvider: CulqiProvider,
  ) {
    this.paymentProviders.set('culqi', this.culqiProvider);
  }

  async processPayment(
    createPaymentDto: CreatePaymentDto,
  ): Promise<PaymentTransaction> {
    const {
      orderId,
      paymentMethod,
      amount,
      currency,
      customerInfo,
      cardToken,
    } = createPaymentDto;

    const order = await this.ordersService.findOne(orderId);
    console.log("createPaymentDto", createPaymentDto);
    if (order.status !== OrderStatus.PENDING_PAYMENT) {
      throw new BadRequestException('Order is not in a payable state');
    }

    if (order.total !== amount) {
      throw new BadRequestException(
        'Payment amount does not match order total',
      );
    }

    if (order.expiresAt && order.expiresAt < new Date()) {
      await this.ordersService.expireOrder(orderId);
      throw new BadRequestException('Order has expired');
    }

    const transactionId = await this.generateTransactionId();

    const transaction = new this.paymentTransactionModel({
      transactionId,
      orderId: new Types.ObjectId(orderId),
      userId: order.userId,
      amount,
      currency: currency || 'PEN',
      status: PaymentStatus.PROCESSING,
      paymentMethod,
      paymentProvider: 'culqi',
    });

    await transaction.save();

    try {
      const provider = this.paymentProviders.get('culqi')!;
      const result = await provider.processPayment(
        amount,
        currency || 'PEN',
        paymentMethod,
        customerInfo,
        cardToken?.token,
        {
          orderId,
          transactionId,
          description: `Event Platform - Order ${order.orderNumber}`,
        },
      );

      transaction.status = result.success
        ? PaymentStatus.COMPLETED
        : PaymentStatus.FAILED;
      transaction.providerTransactionId = result.providerTransactionId;
      transaction.providerResponse = result.metadata;
      transaction.processedAt = new Date();

      if (!result.success) {
        transaction.failedAt = new Date();
        transaction.failureReason = result.message;
      }

      if (result.metadata?.card && cardToken) {
        transaction.cardInfo = {
          last4: cardToken.last4 || result.metadata.card.last4,
          brand: cardToken.brand || result.metadata.card.brand,
          expiryMonth: '',
          expiryYear: '',
          holderName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        };
      }

      await transaction.save();

      if (result.success) {
        await this.ordersService.updateOrderStatus(orderId, OrderStatus.PAID);

        // 👇 IMPORTANTE: que este método devuelva los tickets
        const tickets =
          await this.ticketsService.generateTicketsForOrder(orderId);

        // 👇 Enviamos los correos usando EmailService
        await this.sendPaymentConfirmationEmail(order, transaction, tickets);
      }

      return transaction;
    } catch (error) {
      transaction.status = PaymentStatus.FAILED;
      transaction.failedAt = new Date();
      transaction.failureReason = error.message;
      await transaction.save();

      throw error;
    }
  }

  /**
   * ⭐ NUEVO: Procesar pago instantáneo (Culqi, Yape)
   * Procesa el pago PRIMERO y crea la orden solo si es exitoso
   */
  async processInstantPayment(
    dto: any, // ProcessInstantPaymentDto
    userId: string,
  ): Promise<{ order: any; orders?: any[]; transaction: PaymentTransactionDocument }> {
    const { customerInfo, billingInfo, paymentMethodId, paymentData } = dto;

    // 1. Generar transaction ID
    const transactionId = await this.generateTransactionId();

    // 2. Obtener carrito y calcular total PRIMERO
    const cartItems = await this.ordersService['cartService'].getCart(userId);

    if (cartItems.length === 0) {
      throw new BadRequestException('Carrito vacío');
    }

    // Calcular total del carrito
    const total = cartItems.reduce(
      (sum: number, item: any) => sum + item.totalPrice,
      0,
    );
    const currency = cartItems[0].currency || 'PEN';

    // 3. Ahora SÍ crear transacción con amount
    const transaction = new this.paymentTransactionModel({
      transactionId,
      userId: new Types.ObjectId(userId),
      amount: total,
      currency: currency,
      status: PaymentStatus.PROCESSING,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      paymentProvider: 'culqi',
    });

    // No guardar aún, falta orderId que es requerido
    // await transaction.save();

    try {
      // 4. ✅ Obtener configuración de Culqi desde BD
      const paymentMethodDoc = await this.paymentMethodModel
        .findById(paymentMethodId)
        .select('+culqiConfig +culqiConfig.secretKey') // ⭐ Select ambos niveles
        .exec();

      console.log('🔍 DEBUG - paymentMethodId:', paymentMethodId);
      console.log('🔍 DEBUG - paymentMethodDoc encontrado:', !!paymentMethodDoc);
      console.log('🔍 DEBUG - paymentMethodDoc.type:', paymentMethodDoc?.type);
      console.log('🔍 DEBUG - paymentMethodDoc.culqiConfig:', paymentMethodDoc?.culqiConfig);
      console.log('🔍 DEBUG - culqiConfig.secretKey existe?:', !!paymentMethodDoc?.culqiConfig?.secretKey);

      if (!paymentMethodDoc) {
        throw new NotFoundException(
          `Método de pago con ID ${paymentMethodId} no encontrado`,
        );
      }

      if (paymentMethodDoc.type !== 'culqi') {
        throw new BadRequestException(
          'El método de pago seleccionado no es Culqi',
        );
      }

      if (!paymentMethodDoc.culqiConfig?.secretKey) {
        throw new BadRequestException(
          'El método de pago Culqi no tiene secretKey configurado',
        );
      }

      this.logger.log(
        `Using Culqi credentials from DB for PaymentMethod: ${paymentMethodDoc.name}`,
      );

      // 5. ⭐ PROCESAR PAGO PRIMERO (antes de crear orden)
      const provider = this.paymentProviders.get('culqi')!;

      const paymentResult = await provider.processPayment(
        total,
        currency,
        PaymentMethod.CREDIT_CARD,
        customerInfo,
        paymentData.token,
        {
          userId,
          description: `Compra de ${cartItems.length} tickets`,
        },
        { secretKey: paymentMethodDoc.culqiConfig.secretKey },
      );

      // 6. Si pago FALLÓ, no crear orden
      if (!paymentResult.success) {
        // No podemos guardar porque falta orderId
        // Solo lanzamos error
        throw new BadRequestException(
          paymentResult.message || 'Pago rechazado',
        );
      }

      // 6. ✅ Pago EXITOSO → Crear órdenes (puede haber múltiples por evento)
      const orderDtos = await this.ordersService.createOrderFromCart(userId, {
        customerInfo,
        billingInfo,
        paymentMethodId,
      });

      if (!orderDtos || orderDtos.length === 0) {
        throw new Error('No se crearon órdenes a partir del carrito');
      }

      // Usamos la primera orden como referencia principal para la transacción
      const primaryOrder = orderDtos[0];

      // 7. Actualizar transacción con todos los orderIds
      transaction.orderIds = orderDtos.map(o => new Types.ObjectId(o.id)); // ✅ Todos los IDs
      transaction.status = PaymentStatus.COMPLETED;
      transaction.providerTransactionId = paymentResult.providerTransactionId;
      transaction.providerResponse = paymentResult.metadata;
      transaction.processedAt = new Date();

      if (paymentData.token) {
        transaction.cardInfo = {
          last4: paymentResult.metadata?.last4 || 'xxxx',
          brand: paymentResult.metadata?.brand || 'unknown',
        };
      }

      // Guardar transacción
      await transaction.save();

      this.logger.log(`✅ Transaction saved with ${orderDtos.length} orders`);

      // 8. Recorrer TODAS las órdenes para actualizar estado y generar tickets
      for (const orderDto of orderDtos) {
        // Actualizar orden a PAID
        await this.ordersService.updateOrderStatus(
          orderDto.id,
          OrderStatus.PAID,
        );

        // Generar tickets automáticamente para esta orden
        await this.ticketsService.generateTicketsForOrder(orderDto.id);
      }

      // 10. Enviar emails
      // await this.sendPaymentConfirmationEmail(...);

      return {
        order: primaryOrder, // Retornamos la orden principal o todas? Por ahora la principal para mantener contrato
        orders: orderDtos, // Retornamos también el array completo por si el front lo usa
        transaction,
      };
    } catch (error) {
      // ❌ NO intentar guardar transacción si no tiene orderId
      // La transacción fallida se registra solo si el error ocurre DESPUÉS de crear la orden
      this.logger.error('Error en processInstantPayment:', error.message);

      throw error;
    }
  }

  async refundPayment(
    transactionId: string,
    refundAmount?: number,
    reason: RefundReason = RefundReason.CUSTOMER_REQUEST,
  ): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionModel
      .findOne({ transactionId })
      .populate('orderId')
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    if (transaction.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Only completed payments can be refunded');
    }

    const amountToRefund = refundAmount || transaction.amount;

    if (amountToRefund > transaction.amount) {
      throw new BadRequestException(
        'Refund amount cannot exceed payment amount',
      );
    }

    try {
      const provider = this.paymentProviders.get(transaction.paymentProvider)!;

      if (!transaction.providerTransactionId) {
        throw new BadRequestException('Provider transaction ID is missing');
      }
      const result = await provider.refundPayment(
        transaction.providerTransactionId,
        amountToRefund,
        reason,
      );

      if (result.success) {
        transaction.status =
          amountToRefund === transaction.amount
            ? PaymentStatus.REFUNDED
            : PaymentStatus.PARTIAL_REFUND;
        transaction.refundedAt = new Date();
        transaction.refundAmount = amountToRefund;
        transaction.refundReason = reason;

        await transaction.save();

        // Actualizar estado de todas las órdenes relacionadas
        for (const ordId of transaction.orderIds) {
          await this.ordersService.updateOrderStatus(
            ordId.toString(),
            OrderStatus.REFUNDED,
          );

          await this.ticketsService.cancelTicketsForOrder(
            ordId.toString(),
          );
        }

        this.sendRefundNotificationEmail(transaction);
      }

      return transaction;
    } catch (error) {
      throw new BadRequestException(`Refund failed: ${error.message}`);
    }
  }

  async getPaymentHistory(userId: string): Promise<PaymentTransaction[]> {
    return this.paymentTransactionModel
      .find({ userId: new Types.ObjectId(userId) })
      .populate({
        path: 'orderId',
        populate: {
          path: 'eventId',
          select: 'title startDate endDate',
        },
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getTransaction(transactionId: string): Promise<PaymentTransaction> {
    const transaction = await this.paymentTransactionModel
      .findOne({ transactionId })
      .populate({
        path: 'orderId',
        populate: {
          path: 'eventId',
          select: 'title startDate endDate',
        },
      })
      .exec();

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }

  async handleWebhook(
    provider: string,
    payload: any,
    signature?: string,
  ): Promise<void> {
    const paymentProvider = this.paymentProviders.get(provider);

    if (!paymentProvider) {
      throw new BadRequestException('Unknown payment provider');
    }

    if (!paymentProvider.validateWebhook(payload, signature)) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const eventType = payload.type || payload.object;
    const data = payload.data;

    switch (eventType) {
      case 'charge.successful':
      case 'charge.succeeded':
        await this.handleSuccessfulPayment(data);
        break;

      case 'charge.failed':
        await this.handleFailedPayment(data);
        break;

      case 'refund.successful':
        await this.handleSuccessfulRefund(data);
        break;

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }
  }

  private async handleSuccessfulPayment(data: any): Promise<void> {
    const transaction = await this.paymentTransactionModel
      .findOne({ providerTransactionId: data.id })
      .exec();

    if (transaction && transaction.status === PaymentStatus.PROCESSING) {
      transaction.status = PaymentStatus.COMPLETED;
      transaction.processedAt = new Date();
      await transaction.save();

      // Actualizar estado de todas las órdenes relacionadas
      for (const ordId of transaction.orderIds) {
        await this.ordersService.updateOrderStatus(
          ordId.toString(),
          OrderStatus.PAID,
        );

        await this.ticketsService.generateTicketsForOrder(
          ordId.toString(),
        );
      }
    }
  }

  private async handleFailedPayment(data: any): Promise<void> {
    const transaction = await this.paymentTransactionModel
      .findOne({ providerTransactionId: data.id })
      .exec();

    if (transaction && transaction.status === PaymentStatus.PROCESSING) {
      transaction.status = PaymentStatus.FAILED;
      transaction.failedAt = new Date();
      transaction.failureReason = data.failure_message || 'Payment failed';
      await transaction.save();
    }
  }

  private async handleSuccessfulRefund(data: any): Promise<void> {
    const transaction = await this.paymentTransactionModel
      .findOne({ providerTransactionId: data.charge_id })
      .exec();

    if (transaction) {
      transaction.status = PaymentStatus.REFUNDED;
      transaction.refundedAt = new Date();
      transaction.refundAmount = data.amount / 100;
      await transaction.save();
    }
  }

  private async generateTransactionId(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    const startOfDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const lastTransaction = await this.paymentTransactionModel
      .findOne({
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })
      .sort({ createdAt: -1 })
      .exec();

    let sequence = 1;
    if (lastTransaction) {
      const lastSequence = parseInt(
        lastTransaction.transactionId.split('-')[2],
      );
      sequence = lastSequence + 1;
    }

    return `TXN-${dateStr}-${sequence.toString().padStart(3, '0')}`;
  }

  private async sendPaymentConfirmationEmail(
    order: any,
    transaction: PaymentTransaction,
    tickets: any[],
  ): Promise<void> {
    try {
      // 1. Obtener evento y empresa
      const event = await this.eventModel
        .findById(order.eventId)
        .populate('companyId')
        .exec();

      const company =
        event && (event as any).companyId
          ? await this.companyModel.findById((event as any).companyId).exec()
          : null;

      // 2. Construir info de montos
      const platformFee = transaction['platformFee'] || 0;
      const providerFee = transaction['paymentProviderFee'] || 0;
      const netAmount = transaction.amount - platformFee - providerFee;
      const taxableAmount = transaction.amount / 1.18;
      const igv = transaction.amount - taxableAmount;

      // 3. Enviar notificaciones de pago (cliente + admins, etc.)
      const emailResults = await this.emailService.sendAllPaymentNotifications(
        order.customerInfo.email,
        {
          transactionId: transaction.transactionId,
          orderNumber: order.orderNumber,
          amount: transaction.amount,
          currency: transaction.currency,
          paymentMethod: transaction.paymentMethod,
          paymentProvider: transaction.paymentProvider,
          customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
          customerEmail: order.customerInfo.email,
          customerDocument: order.customerInfo.documentNumber,
          billingInfo: order.billingInfo, // si lo tienes en la orden
          eventTitle: event?.title || 'N/A',
          eventDate: event?.startDate || new Date(),
          companyName: company?.name || 'N/A',
          ticketsCount: tickets.length,
          platformFee,
          providerFee,
          netAmount,
          taxableAmount,
          igv,
        },
      );

      console.log(
        `Payment notifications sent: ${JSON.stringify(emailResults)}`,
      );

      // 4. Enviar confirmación de tickets al cliente
      await this.emailService.sendTicketConfirmation(
        order.customerInfo.email,
        order.orderNumber,
        tickets.map((t) => ({
          ticketNumber: t.ticketNumber,
          ticketTypeName: t.ticketTypeName,
          price: t.price,
          qrCode: t.qrCode,
        })),
        {
          title: event?.title,
          startDate: event?.startDate,
          location: event?.location,
        },
      );
    } catch (error) {
      console.error(
        `Error sending payment confirmation emails for order ${order.orderNumber}: ${error.message}`,
      );
    }
  }

  private async sendRefundNotificationEmail(
    transaction: PaymentTransaction,
  ): Promise<void> {
    // TODO: Implement email service integration
    console.log(
      `Refund notification email sent for transaction ${transaction.transactionId}`,
    );
  }
}
