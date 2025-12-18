import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsMongoId,
  ValidateNested,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodType } from '../enums/payment-method-type.enum';

export class BankAccountInfoDto {
  @ApiProperty({ example: 'Banco de Crédito del Perú' })
  @IsString()
  bankName: string;

  @ApiProperty({ example: '191-123456789-0-12' })
  @IsString()
  accountNumber: string;

  @ApiProperty({ example: 'Cuenta Corriente' })
  @IsString()
  accountType: string;

  @ApiProperty({ example: 'ACME S.A.C.' })
  @IsString()
  accountHolder: string;

  @ApiProperty({ example: '20123456789' })
  @IsString()
  identificationNumber: string;

  @ApiPropertyOptional({ example: '00219100123456789012' })
  @IsOptional()
  @IsString()
  interbankCode?: string;
}

export class CulqiConfigDto {
  @ApiProperty()
  @IsString()
  publicKey: string;

  @ApiProperty()
  @IsString()
  secretKey: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  isLiveMode: boolean;

  @ApiPropertyOptional({ type: [String], example: ['card', 'yape', 'wallet'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  enabledMethods?: string[];

  @ApiPropertyOptional({
    example: 0.035,
    description: 'Comisión adicional (3.5%)',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;
}

export class PaymentMethodSettingsDto {
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  requiresVerification?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  autoConfirm?: boolean;

  @ApiPropertyOptional({ default: 24 })
  @IsOptional()
  @IsNumber()
  verificationTimeoutHours?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  allowVoucher?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedVoucherTypes?: string[];

  @ApiPropertyOptional({ default: 5242880, description: '5MB en bytes' })
  @IsOptional()
  @IsNumber()
  maxVoucherSize?: number;
}

export class CreatePaymentMethodDto {
  @ApiProperty({ example: 'Transferencia BCP' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Transferencia a cuenta corriente BCP' })
  @IsString()
  description: string;

  @ApiProperty({
    enum: PaymentMethodType,
    example: PaymentMethodType.BANK_TRANSFER,
  })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiPropertyOptional({ description: 'ID de empresa (null = global)' })
  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @ApiPropertyOptional({ type: BankAccountInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankAccountInfoDto)
  bankAccount?: BankAccountInfoDto;

  @ApiPropertyOptional({ type: CulqiConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CulqiConfigDto)
  culqiConfig?: CulqiConfigDto;

  @ApiPropertyOptional({ type: PaymentMethodSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMethodSettingsDto)
  settings?: PaymentMethodSettingsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  instructions?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}
