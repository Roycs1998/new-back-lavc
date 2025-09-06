import {
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  ValidateNested,
  IsEmail,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../common/enums/payment-method.enum';
import { Currency } from 'src/common/enums/currency.enum';
import { DocumentType } from 'src/common/enums/document-type.enum';

export class CardTokenDto {
  @ApiProperty({ description: 'Culqi token for card payment' })
  @IsString()
  token: string;

  @ApiPropertyOptional({ description: 'Card last 4 digits' })
  @IsOptional()
  @IsString()
  last4?: string;

  @ApiPropertyOptional({ description: 'Card brand' })
  @IsOptional()
  @IsString()
  brand?: string;
}

export class CustomerInfoDto {
  @ApiProperty({ description: 'Customer first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ description: 'Customer last name' })
  @IsString()
  lastName: string;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Customer phone' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Document type',
    enum: DocumentType,
  })
  @IsEnum(DocumentType)
  documentType: DocumentType;

  @ApiProperty({ description: 'Document number' })
  @IsString()
  documentNumber: string;
}

export class BillingInfoDto {
  @ApiPropertyOptional({ description: 'Company name (for business invoice)' })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiPropertyOptional({ description: 'Company RUC' })
  @IsOptional()
  @IsString()
  ruc?: string;

  @ApiPropertyOptional({ description: 'Billing address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Is business purchase', default: false })
  isCompany: boolean = false;
}

export class CreatePaymentDto {
  @ApiProperty({ description: 'Order ID to pay' })
  @IsString()
  orderId: string;

  @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({ description: 'Payment amount' })
  @IsNumber()
  amount: number;

  @ApiPropertyOptional({
    description: 'Currency',
    enum: Currency,
    default: Currency.PEN,
  })
  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @ApiProperty({ description: 'Customer information' })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  @ApiPropertyOptional({ description: 'Billing information' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BillingInfoDto)
  billingInfo?: BillingInfoDto;

  @ApiPropertyOptional({ description: 'Card token (for card payments)' })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardTokenDto)
  cardToken?: CardTokenDto;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: any;
}
