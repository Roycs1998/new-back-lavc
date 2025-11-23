import { NestFactory } from '@nestjs/core';

import { AppModule } from 'src/app.module';
import { PaymentMethodType } from 'src/payment-methods/enums/payment-method-type.enum';
import { PaymentMethodsService } from 'src/payment-methods/payment-methods.service';

async function seedPaymentMethods() {
  const app = await NestFactory.create(AppModule);
  const service = app.get(PaymentMethodsService);

  // Método Culqi
  await service.create({
    name: 'Culqi - Tarjetas y Yape',
    description: 'Pago con tarjeta de crédito/débito o Yape',
    type: PaymentMethodType.CULQI,
    culqiConfig: {
      publicKey: process.env.CULQI_PUBLIC_KEY || 'prueba_public_key',
      secretKey: process.env.CULQI_SECRET_KEY || 'prueba_secret_key',
      isLiveMode: false,
      enabledMethods: ['card', 'yape', 'wallet'],
      commissionRate: 0.039,
    },
    settings: {
      requiresVerification: false,
      autoConfirm: true,
      allowVoucher: false,
    },
    isActive: true,
    displayOrder: 1,
  }, 'system');

  // Transferencia bancaria
  await service.create({
    name: 'Transferencia Bancaria BCP',
    description: 'Transferencia o depósito bancario',
    type: PaymentMethodType.BANK_TRANSFER,
    bankAccount: {
      bankName: 'Banco de Crédito del Perú',
      accountNumber: '191-123456789-0-12',
      accountType: 'Cuenta Corriente',
      accountHolder: 'LAVC S.A.C.',
      identificationNumber: '20123456789',
      interbankCode: '00219100123456789012',
    },
    settings: {
      requiresVerification: true,
      autoConfirm: false,
      verificationTimeoutHours: 24,
      allowVoucher: true,
      allowedVoucherTypes: ['image/png', 'image/jpeg', 'application/pdf'],
      maxVoucherSize: 5 * 1024 * 1024,
    },
    instructions: 'Realiza la transferencia y sube el voucher. Tu orden será verificada en máximo 24 horas.',
    isActive: true,
    displayOrder: 2,
  }, 'system');

  console.log('✅ Payment methods seeded successfully');
  await app.close();
}

seedPaymentMethods();
