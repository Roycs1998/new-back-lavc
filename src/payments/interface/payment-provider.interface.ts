import { PaymentMethod } from '../../common/enums/payment-method.enum';

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  providerTransactionId?: string;
  amount: number;
  currency: string;
  status: string;
  message?: string;
  metadata?: any;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  currency: string;
  status: string;
  message?: string;
}

export interface PaymentProvider {
  processPayment(
    amount: number,
    currency: string,
    paymentMethod: PaymentMethod,
    customerInfo: any,
    cardToken?: string,
    metadata?: any,
  ): Promise<PaymentResult>;

  refundPayment(
    providerTransactionId: string,
    amount: number,
    reason?: string,
  ): Promise<RefundResult>;

  getPaymentStatus(providerTransactionId: string): Promise<any>;

  validateWebhook(payload: any, signature?: string): boolean;
}
