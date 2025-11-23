import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsMongoId, IsBoolean, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethodType } from '../enums/payment-method-type.enum';

export class PaymentMethodFilterDto {
  @ApiPropertyOptional({ enum: PaymentMethodType })
  @IsOptional()
  @IsEnum(PaymentMethodType)
  type?: PaymentMethodType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  companyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}
