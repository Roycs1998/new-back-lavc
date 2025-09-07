import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Currency } from 'src/common/enums/currency.enum';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';

class PricingTierViewDto {
  @ApiProperty({ example: '66e3a5a2f1c0b5a6d7e8f901' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Preventa' })
  @Expose()
  name!: string;

  @ApiProperty({ example: 80 })
  @Expose()
  price!: number;

  @ApiProperty({ example: '2025-08-01T00:00:00.000Z' })
  @Expose()
  startDate!: Date;

  @ApiProperty({ example: '2025-08-15T23:59:59.000Z' })
  @Expose()
  endDate!: Date;

  @ApiProperty({ example: true })
  @Expose()
  isActive!: boolean;
}

class TicketRestrictionsViewDto {
  @ApiProperty({ example: 1 })
  @Expose()
  minPerOrder!: number;

  @ApiProperty({ example: 10 })
  @Expose()
  maxPerOrder!: number;

  @ApiPropertyOptional({ example: 4 })
  @Expose()
  maxPerUser?: number;

  @ApiProperty({ example: false })
  @Expose()
  requiresApproval!: boolean;

  @ApiProperty({ example: true })
  @Expose()
  transferable!: boolean;

  @ApiProperty({ example: false })
  @Expose()
  refundable!: boolean;
}

class TicketAccessViewDto {
  @ApiPropertyOptional({ type: [String], example: ['Keynote', 'Expo Hall'] })
  @Expose()
  includesAccess?: string[];

  @ApiPropertyOptional({ type: [String], example: ['VIP Lounge'] })
  @Expose()
  excludesAccess?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['Coffee break', 'Merch pack'],
  })
  @Expose()
  perks?: string[];
}

@Exclude()
export class TicketTypeDto {
  @ApiProperty({ example: '66e3a5a2f1c0b5a6d7e8f901' })
  @Expose()
  id!: string;

  @ApiProperty({ example: '66e2d9a0b7f0a9a1c2d3e4f5' })
  @Expose()
  eventId!: string;

  @ApiProperty({ example: 'General' })
  @Expose()
  name!: string;

  @ApiPropertyOptional({ example: 'Acceso a todas las charlas' })
  @Expose()
  description?: string;

  @ApiProperty({ example: 100 })
  @Expose()
  price!: number;

  @ApiProperty({ enum: Currency, example: Currency.PEN })
  @Expose()
  currency!: Currency;

  @ApiProperty({ example: 300 })
  @Expose()
  quantity!: number;

  @ApiProperty({ example: 125 })
  @Expose()
  sold!: number;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.AVAILABLE })
  @Expose()
  ticketStatus!: TicketStatus;

  @ApiPropertyOptional({ example: '2025-08-01T00:00:00.000Z' })
  @Expose()
  saleStartDate?: Date;

  @ApiPropertyOptional({ example: '2025-09-30T23:59:59.000Z' })
  @Expose()
  saleEndDate?: Date;

  @ApiPropertyOptional({ type: [PricingTierViewDto] })
  @Type(() => PricingTierViewDto)
  @Expose()
  pricingTiers?: PricingTierViewDto[];

  @ApiProperty({ type: TicketRestrictionsViewDto })
  @Type(() => TicketRestrictionsViewDto)
  @Expose()
  restrictions!: TicketRestrictionsViewDto;

  @ApiProperty({ type: TicketAccessViewDto })
  @Type(() => TicketAccessViewDto)
  @Expose()
  access!: TicketAccessViewDto;

  @ApiProperty({
    description: 'Tickets disponibles (quantity - sold)',
    example: 175,
  })
  @Expose()
  available!: number;

  @ApiProperty({
    description: 'Precio vigente según tiers o base',
    example: 90,
  })
  @Expose()
  currentPrice!: number;

  @ApiProperty({ example: '2025-07-20T10:15:30.000Z' })
  @Expose()
  createdAt!: Date;
}
