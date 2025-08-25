import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrencyCode } from 'src/common/enums/currency.enum';

class PricingTierDto {
  @ApiProperty({ description: 'Tier name (e.g., "Early Bird", "Regular")' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Tier price', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Tier start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Tier end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Tier is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

class TicketRestrictionsDto {
  @ApiPropertyOptional({ description: 'Minimum tickets per order', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minPerOrder?: number;

  @ApiPropertyOptional({
    description: 'Maximum tickets per order',
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxPerOrder?: number;

  @ApiPropertyOptional({ description: 'Maximum tickets per user' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxPerUser?: number;

  @ApiPropertyOptional({ description: 'Requires approval', default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({ description: 'Transferable', default: true })
  @IsOptional()
  @IsBoolean()
  transferable?: boolean;

  @ApiPropertyOptional({ description: 'Refundable', default: false })
  @IsOptional()
  @IsBoolean()
  refundable?: boolean;
}

class TicketAccessDto {
  @ApiPropertyOptional({ description: 'Areas/sessions included' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includesAccess?: string[];

  @ApiPropertyOptional({ description: 'Areas/sessions excluded' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludesAccess?: string[];

  @ApiPropertyOptional({ description: 'Additional perks' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perks?: string[];
}

export class CreateTicketTypeDto {
  @ApiProperty({ description: 'Ticket type name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Ticket type description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Base price', minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Currency',
    enum: CurrencyCode,
    default: CurrencyCode.PEN,
  })
  @IsOptional()
  @IsEnum(CurrencyCode)
  currency?: string;

  @ApiProperty({ description: 'Total quantity available', minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Sale start date' })
  @IsOptional()
  @IsDateString()
  saleStartDate?: string;

  @ApiPropertyOptional({ description: 'Sale end date' })
  @IsOptional()
  @IsDateString()
  saleEndDate?: string;

  @ApiPropertyOptional({
    description: 'Pricing tiers (early bird, regular, etc.)',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingTierDto)
  pricingTiers?: PricingTierDto[];

  @ApiPropertyOptional({ description: 'Ticket restrictions' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TicketRestrictionsDto)
  restrictions?: TicketRestrictionsDto;

  @ApiPropertyOptional({ description: 'Access permissions and perks' })
  @IsOptional()
  @ValidateNested()
  @Type(() => TicketAccessDto)
  access?: TicketAccessDto;
}
