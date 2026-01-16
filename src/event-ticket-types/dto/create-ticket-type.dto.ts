import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  IsNotEmpty,
  MaxLength,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Currency } from 'src/common/enums/currency.enum';
import { TicketStatus } from 'src/common/enums/ticket-status.enum';

export class PricingTierCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @ApiProperty({ description: 'Nombre del tier', example: 'Preventa' })
  name!: string;

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Precio del tier', example: 80 })
  price!: number;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Inicio de vigencia (ISO)',
    example: '2025-08-01T00:00:00.000Z',
  })
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({
    description: 'Fin de vigencia (ISO)',
    example: '2025-08-15T23:59:59.000Z',
  })
  endDate!: Date;

  @IsBoolean()
  @ApiProperty({ description: 'Si el tier está activo', example: true })
  isActive!: boolean;
}

export class TicketRestrictionsDto {
  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Mínimo por orden', example: 1 })
  minPerOrder!: number;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Máximo por orden', example: 10 })
  maxPerOrder!: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ description: 'Máximo por usuario', example: 4 })
  maxPerUser?: number;

  @IsBoolean()
  @ApiProperty({ description: '¿Requiere aprobación?', example: false })
  requiresApproval!: boolean;

  @IsBoolean()
  @ApiProperty({ description: '¿Es transferible?', example: true })
  transferable!: boolean;

  @IsBoolean()
  @ApiProperty({ description: '¿Es reembolsable?', example: false })
  refundable!: boolean;
}

export class TicketAccessDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'Accesos incluidos',
    type: [String],
    example: ['Keynote', 'Expo Hall'],
  })
  includesAccess?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'Accesos excluidos',
    type: [String],
    example: ['VIP Lounge'],
  })
  excludesAccess?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({
    description: 'Beneficios/perks',
    type: [String],
    example: ['Coffee break', 'Merch pack'],
  })
  perks?: string[];
}

export class CreateTicketTypeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @ApiProperty({ description: 'Nombre del tipo de ticket', example: 'General' })
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({
    description: 'Descripción del ticket',
    example: 'Acceso a todas las charlas',
  })
  description?: string;

  @IsEnum(Currency)
  @ApiProperty({ description: 'Moneda', enum: Currency, example: Currency.PEN })
  currency!: Currency;

  @IsNumber()
  @Min(1)
  @ApiProperty({ description: 'Cantidad total disponible', example: 300 })
  quantity!: number;

  @IsOptional()
  @IsEnum(TicketStatus)
  @ApiPropertyOptional({
    description: 'Estado del ticket al crear (por defecto AVAILABLE)',
    enum: TicketStatus,
    example: TicketStatus.AVAILABLE,
  })
  ticketStatus?: TicketStatus;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({
    description: 'Inicio de venta (ISO)',
    example: '2025-08-01T00:00:00.000Z',
  })
  saleStartDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({
    description: 'Fin de venta (ISO)',
    example: '2025-09-30T23:59:59.000Z',
  })
  saleEndDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ description: 'Precio de la entrada', example: 80 })
  price?: number;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PricingTierCreateDto)
  @IsArray()
  @ApiPropertyOptional({
    description: 'Tiers de precio temporales (opcional)',
    type: [PricingTierCreateDto],
  })
  pricingTiers?: PricingTierCreateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => TicketRestrictionsDto)
  @ApiPropertyOptional({
    description: 'Restricciones de compra',
    type: TicketRestrictionsDto,
  })
  restrictions?: TicketRestrictionsDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => TicketAccessDto)
  @ApiPropertyOptional({
    description: 'Accesos y beneficios',
    type: TicketAccessDto,
  })
  access?: TicketAccessDto;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Rol objetivo (ParticipantType o rol personalizado)',
    example: 'STAFF',
  })
  targetRole?: string;
}

