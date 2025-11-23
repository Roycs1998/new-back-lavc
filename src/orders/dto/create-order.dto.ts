import { ValidateNested, IsOptional, IsMongoId } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  CustomerInfoDto,
  BillingInfoDto,
} from '../../payments/dto/create-payment.dto';

export class CreateOrderDto {
  @ApiProperty({
    description: 'Datos del cliente para facturación y contacto',
    type: CustomerInfoDto,
  })
  @ValidateNested()
  @Type(() => CustomerInfoDto)
  customerInfo: CustomerInfoDto;

  @ApiPropertyOptional({
    description: 'Datos de facturación (empresa/RUC), opcional',
    type: BillingInfoDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BillingInfoDto)
  billingInfo?: BillingInfoDto;

  @ApiProperty({ description: 'ID del método de pago' })
  @IsMongoId()
  paymentMethodId: string;
}
