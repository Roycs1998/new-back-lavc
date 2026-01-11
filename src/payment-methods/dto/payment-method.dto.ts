import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType } from '../enums/payment-method-type.enum';
import { EntityStatus } from 'src/common/enums/entity-status.enum';

export class BankAccountInfoResponseDto {
  @ApiProperty()
  @Expose()
  bankName: string;

  @ApiProperty()
  @Expose()
  accountNumber: string;

  @ApiProperty()
  @Expose()
  accountType: string;

  @ApiProperty()
  @Expose()
  accountHolder: string;

  @ApiProperty()
  @Expose()
  identificationNumber: string;

  @ApiPropertyOptional()
  @Expose()
  interbankCode?: string;
}

export class PaymentMethodSettingsResponseDto {
  @ApiProperty()
  @Expose()
  requiresVerification: boolean;

  @ApiProperty()
  @Expose()
  autoConfirm: boolean;

  @ApiProperty()
  @Expose()
  verificationTimeoutHours: number;

  @ApiProperty()
  @Expose()
  allowVoucher: boolean;

  @ApiProperty()
  @Expose()
  allowedVoucherTypes: string[];

  @ApiProperty()
  @Expose()
  maxVoucherSize: number;
}

// ⭐ DTO for Culqi Config (ONLY PUBLIC DATA - NO SECRET KEY)
export class CulqiConfigResponseDto {
  @ApiProperty({ description: 'Culqi public key for frontend' })
  @Expose()
  publicKey: string;

  @ApiProperty({ description: 'Is live mode (production)' })
  @Expose()
  isLiveMode: boolean;

  @ApiProperty({ description: 'Enabled payment methods' })
  @Expose()
  enabledMethods: string[];

  @ApiProperty({ description: 'Commission rate' })
  @Expose()
  commissionRate: number;

  // ⚠️ IMPORTANT: secretKey is NOT exposed for security
}

export class PaymentMethodDto {
  @ApiProperty()
  @Expose()
  _id: string;

  @ApiProperty()
  @Expose()
  id: string; // ✅ Mongoose virtual 'id' - mapea de _id

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty({ enum: PaymentMethodType })
  @Expose()
  type: PaymentMethodType;

  @ApiPropertyOptional()
  @Expose()
  companyId?: string;

  @ApiPropertyOptional({ type: BankAccountInfoResponseDto })
  @Expose()
  @Type(() => BankAccountInfoResponseDto)
  bankAccount?: BankAccountInfoResponseDto;

  @ApiPropertyOptional({ type: CulqiConfigResponseDto })
  @Expose()
  @Type(() => CulqiConfigResponseDto)
  culqiConfig?: CulqiConfigResponseDto;

  @ApiProperty({ type: PaymentMethodSettingsResponseDto })
  @Expose()
  @Type(() => PaymentMethodSettingsResponseDto)
  settings: PaymentMethodSettingsResponseDto;

  @ApiPropertyOptional()
  @Expose()
  logo?: string;

  @ApiPropertyOptional()
  @Expose()
  instructions?: string;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  displayOrder: number;

  @ApiProperty({ enum: EntityStatus })
  @Expose()
  entityStatus: EntityStatus;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;
}
