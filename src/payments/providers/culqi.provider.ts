import axios from 'axios';
import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import {
  PaymentProvider,
  PaymentResult,
  RefundResult,
} from '../interface/payment-provider.interface';

@Injectable()
export class CulqiProvider implements PaymentProvider {
  private readonly logger = new Logger(CulqiProvider.name);
  private readonly apiUrl: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = 'https://api.culqi.com/v2';
    this.secretKey =
      this.configService.getOrThrow<string>('app.culqiSecretKey');

    if (!this.secretKey) {
      this.logger.warn('Culqi secret key not configured');
    }
  }

  async processPayment(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    customerInfo: any,
    cardToken?: string,
    metadata?: any,
    config?: { secretKey?: string }, // ✅ NUEVO: Config dinámico desde BD
  ): Promise<PaymentResult> {
    try {
      // ✅ Usar secretKey dinámico si se proporciona, sino el de env
      const secretKey = config?.secretKey || this.secretKey;

      if (!secretKey) {
        throw new BadRequestException('Culqi secret key not configured');
      }

      // ⭐ CORE LOGIC: Convert amount to cents for Culqi (mantiene lógica del proyecto anterior)
      const amountInCents = Math.round(amount * 100);

      // ⭐ CORE LOGIC: Prepare charge data (estructura exacta del proyecto anterior)
      const chargeData = {
        amount: amountInCents,
        currency_code: currency,
        email: customerInfo.email,
        source_id: cardToken,
        description: metadata?.description || 'Event Platform Purchase',
        metadata: {
          order_id: metadata?.orderId,
          customer_name: `${customerInfo.firstName} ${customerInfo.lastName}`,
          customer_document: customerInfo.documentNumber,
          ...metadata,
        },
      };

      this.logger.log(
        `Processing Culqi payment for amount: ${amountInCents} ${currency}`,
      );
      this.logger.log(`Using ${config?.secretKey ? 'DB' : 'ENV'} credentials`);

      // ⭐ CORE LOGIC: Call Culqi API (mantiene la comunicación exacta)
      const response = await axios.post(`${this.apiUrl}/charges`, chargeData, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const charge = response.data;

      this.logger.log(`Culqi response received: ${JSON.stringify(charge)}`);

      // ⭐ CRITICAL VALIDATION: Check for AUT0000 code (LÓGICA CORE DEL PROYECTO ANTERIOR)
      // Este es el código que indica pago exitoso en Culqi
      if (
        charge.outcome?.code === 'AUT0000' &&
        charge.outcome?.type === 'venta_exitosa'
      ) {
        this.logger.log('✅ Payment approved by Culqi - AUT0000 received');

        return {
          success: true,
          transactionId: charge.id,
          providerTransactionId: charge.id,
          amount: charge.amount / 100,
          currency: charge.currency_code,
          status: 'completed',
          message: charge.outcome.merchant_message || 'Pago exitoso',
          metadata: {
            ...charge,
            outcome: charge.outcome,
            card: charge.source
              ? {
                  last4: charge.source.card_number?.slice(-4),
                  brand: charge.source.card_brand,
                  type: charge.source.card_type,
                }
              : null,
          },
        };
      } else {
        // ⭐ VALIDACIÓN ADICIONAL: Pago no fue aprobado por Culqi
        this.logger.warn(
          `Payment not approved. Outcome code: ${charge.outcome?.code}`,
        );

        return {
          success: false,
          transactionId: charge.id || '',
          amount,
          currency,
          status: 'declined',
          message: charge.outcome?.user_message || 'Pago no autorizado',
          metadata: {
            ...charge,
            outcome: charge.outcome,
          },
        };
      }
    } catch (error) {
      this.logger.error(
        'Culqi payment failed:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        transactionId: '',
        amount,
        currency,
        status: 'failed',
        message:
          error.response?.data?.user_message || 'Payment processing failed',
        metadata: error.response?.data,
      };
    }
  }

  async refundPayment(
    providerTransactionId: string,
    amount: number,
    reason?: string,
    config?: { secretKey?: string }, // ✅ NUEVO: Config dinámico desde BD
  ): Promise<RefundResult> {
    try {
      // ✅ Usar secretKey dinámico si se proporciona, sino el de env
      const secretKey = config?.secretKey || this.secretKey;

      if (!secretKey) {
        throw new BadRequestException('Culqi secret key not configured');
      }

      const amountInCents = Math.round(amount * 100);

      const refundData = {
        amount: amountInCents,
        charge_id: providerTransactionId,
        reason: reason || 'requested_by_customer',
      };

      const response = await axios.post(`${this.apiUrl}/refunds`, refundData, {
        headers: {
          Authorization: `Bearer ${secretKey}`,
          'Content-Type': 'application/json',
        },
      });

      const refund = response.data;

      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        currency: refund.currency_code,
        status: refund.state,
        message: refund.state_message,
      };
    } catch (error) {
      this.logger.error(
        'Culqi refund failed:',
        error.response?.data || error.message,
      );

      return {
        success: false,
        refundId: '',
        amount,
        currency: 'PEN',
        status: 'failed',
        message:
          error.response?.data?.user_message || 'Refund processing failed',
      };
    }
  }

  async getPaymentStatus(providerTransactionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}/charges/${providerTransactionId}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        'Failed to get payment status:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to get payment status');
    }
  }

  validateWebhook(payload: any, signature?: string): boolean {
    // Culqi webhook validation would go here
    // For now, we'll do basic validation
    return payload && payload.object && payload.data;
  }

  async createToken(cardData: any): Promise<string> {
    try {
      const tokenData = {
        card_number: cardData.cardNumber,
        cvv: cardData.cvv,
        expiration_month: cardData.expiryMonth,
        expiration_year: cardData.expiryYear,
        email: cardData.email,
      };

      const response = await axios.post(
        'https://secure.culqi.com/v2/tokens',
        tokenData,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('CULQI_PUBLIC_KEY')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.id;
    } catch (error) {
      this.logger.error(
        'Culqi token creation failed:',
        error.response?.data || error.message,
      );
      throw new BadRequestException('Failed to create payment token');
    }
  }
}
