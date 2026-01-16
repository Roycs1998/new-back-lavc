import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsMongoId,
  MaxLength,
  IsNotEmpty,
  IsUrl,
  IsDate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../common/enums/event-type.enum';
import { EventLocationType } from 'src/common/enums/event-location-type.enum';
import { AgendaItemType } from 'src/common/enums/agenda-item-type.enum';
import { EventStatus } from 'src/common/enums/event-status.enum';

export class EventAddressCreateDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({ example: 'Av. Las Flores 123' })
  street?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @ApiProperty({ example: 'Lima' })
  city!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @ApiPropertyOptional({ example: 'Lima' })
  state?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  @ApiProperty({ example: 'Perú' })
  country!: string;

  @IsOptional()
  @IsString()
  @MaxLength(3)
  @ApiPropertyOptional({
    example: 'PE',
    description: 'Código de país ISO 3166-1 alpha-2',
  })
  countryCode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @ApiPropertyOptional({ example: '15001' })
  zipCode?: string;
}

export class EventVirtualDetailsCreateDto {
  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({ example: 'Zoom' })
  platform?: string;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({
    example: 'https://us02web.zoom.us/j/123456789?pwd=abc',
  })
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({ example: '123-456-789' })
  meetingId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  @ApiPropertyOptional({ example: 'p@ss2025' })
  passcode?: string;
}

export class EventLocationCreateDto {
  @IsEnum(EventLocationType)
  @ApiProperty({ enum: EventLocationType, example: EventLocationType.PHYSICAL })
  type!: EventLocationType;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  @ApiPropertyOptional({ example: 'Centro de Convenciones de Lima' })
  venue?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventAddressCreateDto)
  @ApiPropertyOptional({ type: EventAddressCreateDto })
  address?: EventAddressCreateDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => EventVirtualDetailsCreateDto)
  @ApiPropertyOptional({ type: EventVirtualDetailsCreateDto })
  virtualDetails?: EventVirtualDetailsCreateDto;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @ApiPropertyOptional({ example: 350 })
  capacity?: number;
}

export class EventAgendaItemCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  @ApiProperty({ example: 'Apertura y bienvenida' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ example: 'Presentación de los objetivos del evento.' })
  description?: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: '2025-10-01T14:00:00.000Z' })
  startTime!: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: '2025-10-01T14:30:00.000Z' })
  endTime!: Date;

  @IsOptional()
  @IsMongoId()
  @ApiPropertyOptional({ example: '66b1a0c0d1e2f3a4b5c6d7e8' })
  speakerId?: string;

  @IsEnum(AgendaItemType)
  @ApiProperty({ enum: AgendaItemType, example: AgendaItemType.PRESENTATION })
  type!: AgendaItemType;
}

export class EventRegistrationCreateDto {
  @IsBoolean()
  @ApiProperty({ example: true })
  isOpen!: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ example: '2025-09-01T00:00:00.000Z' })
  opensAt?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ example: '2025-09-30T23:59:59.000Z' })
  closesAt?: Date;

  @IsBoolean()
  @ApiProperty({ example: false })
  requiresApproval!: boolean;

  @IsNumber()
  @Min(1)
  @ApiProperty({ example: 1 })
  maxAttendeesPerRegistration!: number;

  @IsBoolean()
  @ApiProperty({ example: false })
  waitlistEnabled!: boolean;
}

export class EventSettingsCreateDto {
  @IsBoolean()
  @ApiProperty({ example: false })
  isPrivate!: boolean;

  @IsBoolean()
  @ApiProperty({ example: false })
  requiresInvitation!: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ example: 18 })
  ageRestriction?: number;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  @ApiPropertyOptional({ example: 'Formal' })
  dresscode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ example: 'Ingresar por puerta 3. Traer DNI.' })
  specialInstructions?: string;
}

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(140)
  @ApiProperty({ example: 'Congreso Internacional de Gastroenterología 2025' })
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  @ApiPropertyOptional({
    example: 'Evento anual con expertos internacionales.',
  })
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  @ApiPropertyOptional({ example: 'Expertos en hepatología, NAFLD y NASH' })
  shortDescription?: string;

  @IsMongoId()
  @ApiProperty({ example: '66bfca24c3baf17b08c9b111' })
  companyId!: string;

  @IsEnum(EventType)
  @ApiProperty({ enum: EventType, example: EventType.CONFERENCE })
  type!: EventType;

  @IsEnum(EventStatus)
  @ApiProperty({ enum: EventStatus, example: EventStatus.DRAFT })
  eventStatus!: EventStatus;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: '2025-10-01T13:00:00.000Z' })
  startDate!: Date;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ example: '2025-10-02T23:59:59.000Z' })
  endDate!: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'America/Lima' })
  timezone?: string;

  @IsBoolean()
  @ApiProperty({ example: false })
  isAllDay!: boolean;

  @ApiProperty({ type: EventLocationCreateDto })
  @ValidateNested()
  @Type(() => EventLocationCreateDto)
  location: EventLocationCreateDto;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @ApiProperty({ type: [String], example: ['66b1a0c0d1e2f3a4b5c6d7e8'] })
  speakers?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventAgendaItemCreateDto)
  @ApiPropertyOptional({ type: [EventAgendaItemCreateDto] })
  agenda?: EventAgendaItemCreateDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => EventRegistrationCreateDto)
  @ApiProperty({ type: EventRegistrationCreateDto })
  registration?: EventRegistrationCreateDto;

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://cdn.example.com/events/abc.jpg' })
  featuredImage?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true })
  @ApiPropertyOptional({
    type: [String],
    example: ['https://cdn.example.com/1.jpg'],
  })
  images?: string[];

  @IsOptional()
  @IsUrl()
  @ApiPropertyOptional({ example: 'https://youtu.be/xyz' })
  videoUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['gastro', 'hepatología'] })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], example: ['salud', 'medicina'] })
  categories?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'congreso-gastro-2025' })
  slug?: string;

  // ⭐ Campos de Priorización
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional({
    description: 'Prioridad de visualización (1-100)',
    example: 50,
    default: 50,
  })
  displayPriority?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Marcar como evento destacado/principal',
    example: false,
    default: false,
  })
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({
    description: 'Mostrar en homepage',
    example: true,
    default: true,
  })
  showOnHomepage?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({
    description: 'Destacado hasta esta fecha',
    example: '2026-01-31T23:59:59.000Z',
  })
  featuredUntil?: Date;

  @ApiPropertyOptional({ type: EventSettingsCreateDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventSettingsCreateDto)
  settings?: EventSettingsCreateDto;
}
