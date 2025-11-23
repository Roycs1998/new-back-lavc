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

export class PaymentMethodDto {
  @ApiProperty()
  @Expose()
  _id: string;

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
