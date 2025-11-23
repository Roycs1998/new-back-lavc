import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { EmailOptions } from './interfaces/email-options.interface';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly adminEmail?: string;
  private readonly accountantEmail?: string;

  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.adminEmail =
      this.configService.get<string>('ADMIN_EMAIL') ?? process.env.ADMIN_EMAIL;

    this.accountantEmail =
      this.configService.get<string>('ACCOUNTANT_EMAIL') ??
      process.env.ACCOUNTANT_EMAIL;

    if (!this.adminEmail || !this.accountantEmail) {
      this.logger.warn('Admin or Accountant email not configured in environment variables');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      await this.mailerService.sendMail({
        to: options.to,
        subject: options.subject,
        template: options.template,
        context: options.context,
        attachments: options.attachments,
        cc: options.cc,
        bcc: options.bcc,
      });

      this.logger.log(`Email sent successfully to ${options.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send email to ${options.to}:`, error);
      return false;
    }
  }

  // ============= MÉTODOS ESPECÍFICOS =============

  async sendWelcomeEmail(email: string, name: string, verificationToken: string) {
    const verificationUrl = `${this.configService.get('APP_URL')}/auth/verify-email?token=${verificationToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Bienvenido a LAVC - Verifica tu email',
      template: 'welcome',
      context: {
        name,
        verificationUrl,
      },
    });
  }

  async sendTicketConfirmation(
    email: string,
    orderNumber: string,
    tickets: any[],
    eventDetails: any,
  ) {
    return this.sendEmail({
      to: email,
      subject: `Confirmación de compra - Order #${orderNumber}`,
      template: 'ticket-confirmation',
      context: {
        orderNumber,
        tickets,
        eventDetails,
        totalAmount: tickets.reduce((sum, t) => sum + t.price, 0),
      },
    });
  }

  async sendPasswordResetEmail(email: string, resetToken: string) {
    const resetUrl = `${this.configService.get('APP_URL')}/auth/reset-password?token=${resetToken}`;
    
    return this.sendEmail({
      to: email,
      subject: 'Restablecer contraseña',
      template: 'password-reset',
      context: {
        resetUrl,
      },
    });
  }

  async sendEventReminderEmail(email: string, eventDetails: any) {
    return this.sendEmail({
      to: email,
      subject: `Recordatorio: ${eventDetails.title}`,
      template: 'event-reminder',
      context: {
        eventDetails,
      },
    });
  }

  async sendBankTransferInstructions(
    email: string,
    orderNumber: string,
    bankAccount: any,
    amount: number,
  ) {
    return this.sendEmail({
      to: email,
      subject: `Instrucciones de pago - Order #${orderNumber}`,
      template: 'bank-transfer-instructions',
      context: {
        orderNumber,
        bankAccount,
        amount,
      },
    });
  }

  // ============= NOTIFICACIONES DE PAGO =============

  async sendPaymentConfirmationToCustomer(
    customerEmail: string,
    paymentDetails: {
      transactionId: string;
      orderNumber: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      customerName: string;
      eventTitle: string;
      eventDate: Date;
      ticketsCount: number;
    },
  ): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: `Pago confirmado - Order #${paymentDetails.orderNumber}`,
      template: 'payment-confirmation-customer',
      context: {
        ...paymentDetails,
        paymentDate: new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  }

  async sendPaymentNotificationToAdmin(
    paymentDetails: {
      transactionId: string;
      orderNumber: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      paymentProvider: string;
      customerName: string;
      customerEmail: string;
      customerDocument?: string;
      eventTitle: string;
      eventDate: Date;
      companyName: string;
      ticketsCount: number;
      platformFee?: number;
      providerFee?: number;
      netAmount?: number;
    },
  ): Promise<boolean> {
    if (!this.adminEmail) {
      this.logger.warn('Admin email not configured, skipping notification');
      return false;
    }

    return this.sendEmail({
      to: this.adminEmail,
      subject: `[ADMIN] Nuevo pago recibido - ${paymentDetails.currency} ${paymentDetails.amount}`,
      template: 'payment-notification-admin',
      context: {
        ...paymentDetails,
        paymentDate: new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        adminDashboardUrl: `${this.configService.get('APP_URL')}/admin/payments/${paymentDetails.transactionId}`,
      },
    });
  }

  async sendPaymentNotificationToAccountant(
    paymentDetails: {
      transactionId: string;
      orderNumber: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      paymentProvider: string;
      customerName: string;
      customerEmail: string;
      customerDocument?: string;
      billingInfo?: {
        companyName?: string;
        ruc?: string;
        address?: string;
      };
      eventTitle: string;
      eventDate: Date;
      companyName: string;
      ticketsCount: number;
      platformFee?: number;
      providerFee?: number;
      netAmount?: number;
      taxableAmount?: number;
      igv?: number;
    },
  ): Promise<boolean> {
    if (!this.accountantEmail) {
      this.logger.warn('Accountant email not configured, skipping notification');
      return false;
    }

    return this.sendEmail({
      to: this.accountantEmail,
      subject: `[CONTABILIDAD] Nuevo ingreso - ${paymentDetails.currency} ${paymentDetails.amount} - Order #${paymentDetails.orderNumber}`,
      template: 'payment-notification-accountant',
      context: {
        ...paymentDetails,
        paymentDate: new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        accountingPeriod: new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
        }),
      },
    });
  }

  async sendAllPaymentNotifications(
    customerEmail: string,
    paymentDetails: {
      transactionId: string;
      orderNumber: string;
      amount: number;
      currency: string;
      paymentMethod: string;
      paymentProvider: string;
      customerName: string;
      customerEmail: string;
      customerDocument?: string;
      billingInfo?: {
        companyName?: string;
        ruc?: string;
        address?: string;
      };
      eventTitle: string;
      eventDate: Date;
      companyName: string;
      ticketsCount: number;
      platformFee?: number;
      providerFee?: number;
      netAmount?: number;
      taxableAmount?: number;
      igv?: number;
    },
  ): Promise<{
    customer: boolean;
    admin: boolean;
    accountant: boolean;
  }> {
    this.logger.log(`Sending payment notifications for transaction ${paymentDetails.transactionId}`);

    const [customerResult, adminResult, accountantResult] = await Promise.allSettled([
      this.sendPaymentConfirmationToCustomer(customerEmail, paymentDetails),
      this.sendPaymentNotificationToAdmin(paymentDetails),
      this.sendPaymentNotificationToAccountant(paymentDetails),
    ]);

    const results = {
      customer: customerResult.status === 'fulfilled' && customerResult.value,
      admin: adminResult.status === 'fulfilled' && adminResult.value,
      accountant: accountantResult.status === 'fulfilled' && accountantResult.value,
    };

    this.logger.log(`Payment notifications sent: ${JSON.stringify(results)}`);

    return results;
  }

  async sendVoucherUploadedNotification(
    orderNumber: string,
    customerName: string,
    amount: number,
    currency: string,
    voucherUrl: string,
  ): Promise<boolean> {
    if (!this.adminEmail) {
      this.logger.warn('Admin email not configured, skipping voucher notification');
      return false;
    }

    return this.sendEmail({
      to: this.adminEmail,
      cc: this.accountantEmail,
      subject: `[VERIFICAR] Voucher subido - Order #${orderNumber}`,
      template: 'voucher-uploaded-notification',
      context: {
        orderNumber,
        customerName,
        amount,
        currency,
        voucherUrl,
        verifyUrl: `${this.configService.get('APP_URL')}/admin/orders/${orderNumber}/verify`,
        uploadedAt: new Date().toLocaleDateString('es-PE', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      },
    });
  }

  async sendPaymentRejectionNotification(
    customerEmail: string,
    orderNumber: string,
    amount: number,
    currency: string,
    rejectionReason: string,
  ): Promise<boolean> {
    return this.sendEmail({
      to: customerEmail,
      subject: `Pago rechazado - Order #${orderNumber}`,
      template: 'payment-rejection',
      context: {
        orderNumber,
        amount,
        currency,
        rejectionReason,
        supportEmail: this.configService.get('MAIL_FROM_ADDRESS'),
      },
    });
  }
}
