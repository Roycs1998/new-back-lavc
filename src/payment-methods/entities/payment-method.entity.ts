import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { PaymentMethodType } from '../enums/payment-method-type.enum';

export type PaymentMethodDocument = PaymentMethod & Document;

@Schema({ _id: false })
export class BankAccountInfo {
  @Prop({ required: true, trim: true })
  bankName: string;

  @Prop({ required: true, trim: true })
  accountNumber: string;

  @Prop({ required: true, trim: true })
  accountType: string; // Ahorros, Corriente

  @Prop({ trim: true })
  accountHolder: string;

  @Prop({ trim: true })
  identificationNumber: string; // RUC o DNI

  @Prop({ trim: true })
  interbankCode?: string; // CCI
}

export const BankAccountInfoSchema = SchemaFactory.createForClass(BankAccountInfo);

@Schema({ _id: false })
export class CulqiConfig {
  @Prop({ required: true })
  publicKey: string;

  @Prop({ required: true, select: false })
  secretKey: string;

  @Prop({ default: false })
  isLiveMode: boolean;

  @Prop({ type: [String], default: ['card', 'yape', 'wallet'] })
  enabledMethods: string[];

  @Prop({ type: Number, min: 0, max: 1, default: 0 })
  commissionRate: number; // Comisión adicional del método
}

export const CulqiConfigSchema = SchemaFactory.createForClass(CulqiConfig);

@Schema({ _id: false })
export class PaymentMethodSettings {
  @Prop({ default: true })
  requiresVerification: boolean; // ¿Requiere verificación manual?

  @Prop({ default: false })
  autoConfirm: boolean; // Auto-confirmar pagos

  @Prop({ type: Number, default: 24 })
  verificationTimeoutHours: number; // Tiempo para subir comprobante

  @Prop({ default: true })
  allowVoucher: boolean; // Permite subir voucher/comprobante

  @Prop({ type: [String], default: ['image/png', 'image/jpeg', 'application/pdf'] })
  allowedVoucherTypes: string[];

  @Prop({ type: Number, default: 5 * 1024 * 1024 }) // 5MB
  maxVoucherSize: number;
}

export const PaymentMethodSettingsSchema = SchemaFactory.createForClass(PaymentMethodSettings);

@Schema({
  collection: 'payment_methods',
  timestamps: true,
  versionKey: false,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class PaymentMethod {
  @Prop({ required: true, trim: true })
  name: string; // "Transferencia BCP", "Culqi", "Yape BCP"

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({
    type: String,
    enum: PaymentMethodType,
    required: true,
  })
  type: PaymentMethodType;

  @Prop({ type: Types.ObjectId, ref: 'Company' })
  companyId?: Types.ObjectId; // null = global (plataforma)

  @Prop({ type: BankAccountInfoSchema })
  bankAccount?: BankAccountInfo;

  @Prop({ type: CulqiConfigSchema, select: false })
  culqiConfig?: CulqiConfig;

  @Prop({ type: PaymentMethodSettingsSchema, default: {} })
  settings: PaymentMethodSettings;

  @Prop({ trim: true })
  logo?: string; // URL del logo del método

  @Prop({ trim: true })
  instructions?: string; // Instrucciones para el usuario

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  displayOrder: number; // Orden de visualización

  @Prop({
    type: String,
    enum: EntityStatus,
    default: EntityStatus.ACTIVE,
  })
  entityStatus: EntityStatus;

  @Prop({ type: Date })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  createdBy?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

PaymentMethodSchema.virtual('company', {
  ref: 'Company',
  localField: 'companyId',
  foreignField: '_id',
  justOne: true,
});

PaymentMethodSchema.index({ companyId: 1, isActive: 1, type: 1 });
PaymentMethodSchema.index({ entityStatus: 1, isActive: 1 });
