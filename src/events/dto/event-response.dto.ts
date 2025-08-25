import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../../common/enums/event-status.enum';
import { EventType } from '../../common/enums/event-type.enum';
import { EventLocationType } from '../../common/enums/event-location-type.enum';

export class CompanyInfoDto {
  @ApiProperty({ description: 'ID de la empresa' })
  id: string;

  @ApiProperty({ description: 'Nombre de la empresa' })
  name: string;

  @ApiProperty({ description: 'Email de contacto' })
  contactEmail: string;
}

export class SpeakerInfoDto {
  @ApiProperty({ description: 'ID del speaker' })
  id: string;

  @ApiProperty({ description: 'Nombre completo' })
  fullName: string;

  @ApiProperty({ description: 'Especialidad principal' })
  specialty?: string;

  @ApiProperty({ description: 'Biografía corta' })
  bio?: string;

  @ApiProperty({ description: 'URL de foto de perfil' })
  profileImage?: string;
}

export class LocationInfoDto {
  @ApiProperty({ enum: EventLocationType, description: 'Tipo de ubicación' })
  type: EventLocationType;

  @ApiPropertyOptional({ description: 'Nombre del lugar' })
  venue?: string;

  @ApiPropertyOptional({ description: 'Dirección completa' })
  address?: string;

  @ApiProperty({ description: 'Ciudad' })
  city: string;

  @ApiProperty({ description: 'País (código ISO)' })
  country: string;

  @ApiPropertyOptional({ description: 'Coordenadas GPS' })
  coordinates?: {
    latitude: number;
    longitude: number;
  };

  @ApiPropertyOptional({ description: 'Link para eventos virtuales' })
  virtualLink?: string;

  @ApiPropertyOptional({ description: 'Instrucciones de acceso' })
  accessInstructions?: string;
}

export class TicketTypeInfoDto {
  @ApiProperty({ description: 'ID del tipo de ticket' })
  id: string;

  @ApiProperty({ description: 'Nombre del tipo' })
  name: string;

  @ApiProperty({ description: 'Descripción' })
  description?: string;

  @ApiProperty({ description: 'Precio' })
  price: number;

  @ApiProperty({ description: 'Moneda' })
  currency: string;

  @ApiProperty({ description: 'Cantidad disponible' })
  quantityAvailable: number;

  @ApiProperty({ description: 'Cantidad vendida' })
  quantitySold: number;

  @ApiProperty({ description: 'Está activo para venta' })
  isActive: boolean;

  @ApiPropertyOptional({ description: 'Inicio de ventas' })
  saleStartDate?: Date;

  @ApiPropertyOptional({ description: 'Fin de ventas' })
  saleEndDate?: Date;
}

export class EventResponseDto {
  @ApiProperty({ description: 'ID único del evento' })
  id: string;

  @ApiProperty({ description: 'Título del evento' })
  title: string;

  @ApiProperty({ description: 'Descripción detallada' })
  description?: string;

  @ApiProperty({ description: 'Slug URL-friendly' })
  slug: string;

  @ApiProperty({ enum: EventType, description: 'Tipo de evento' })
  type: EventType;

  @ApiProperty({ enum: EventStatus, description: 'Estado actual' })
  status: EventStatus;

  @ApiProperty({ description: 'Fecha y hora de inicio' })
  startDate: Date;

  @ApiProperty({ description: 'Fecha y hora de fin' })
  endDate: Date;

  @ApiProperty({
    type: LocationInfoDto,
    description: 'Información de ubicación',
  })
  location: LocationInfoDto;

  @ApiProperty({ description: 'Número máximo de asistentes' })
  maxAttendees: number;

  @ApiProperty({ description: 'Es público (visible sin autenticación)' })
  isPublic: boolean;

  @ApiProperty({ description: 'Requiere aprobación para asistir' })
  requiresApproval: boolean;

  @ApiProperty({ type: CompanyInfoDto, description: 'Empresa organizadora' })
  company: CompanyInfoDto;

  @ApiProperty({ type: [SpeakerInfoDto], description: 'Ponentes del evento' })
  speakers: SpeakerInfoDto[];

  @ApiProperty({
    type: [TicketTypeInfoDto],
    description: 'Tipos de tickets disponibles',
  })
  ticketTypes: TicketTypeInfoDto[];

  @ApiProperty({ description: 'URL de imagen principal' })
  imageUrl?: string;

  @ApiProperty({ description: 'Etiquetas del evento' })
  tags: string[];

  @ApiProperty({ description: 'Categoría principal' })
  category?: string;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt: Date;

  @ApiProperty({ description: 'Última actualización' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Razón de rechazo si aplica' })
  rejectionReason?: string;

  @ApiPropertyOptional({ description: 'Información adicional' })
  metadata?: {
    totalTicketsSold?: number;
    totalRevenue?: number;
    attendanceRate?: number;
  };
}

export class EventStatsDto {
  @ApiProperty({ description: 'ID del evento' })
  eventId: string;

  @ApiProperty({ description: 'Total de tickets vendidos' })
  totalTicketsSold: number;

  @ApiProperty({ description: 'Ingresos totales' })
  totalRevenue: number;

  @ApiProperty({ description: 'Moneda de los ingresos' })
  currency: string;

  @ApiProperty({ description: 'Tasa de ocupación (%)' })
  occupancyRate: number;

  @ApiProperty({ description: 'Número de asistentes confirmados' })
  confirmedAttendees: number;

  @ApiProperty({ description: 'Asistentes que ingresaron al evento' })
  actualAttendees: number;

  @ApiProperty({ description: 'Tasa de asistencia (%)' })
  attendanceRate: number;

  @ApiProperty({ description: 'Ventas por tipo de ticket' })
  ticketTypeBreakdown: {
    name: string;
    sold: number;
    revenue: number;
    percentage: number;
  }[];

  @ApiProperty({ description: 'Ventas por día' })
  dailySales: {
    date: string;
    tickets: number;
    revenue: number;
  }[];

  @ApiProperty({ description: 'Métricas adicionales' })
  metrics: {
    averageTicketPrice: number;
    peakSalesDay: string;
    daysToSellOut?: number;
    refundRate: number;
  };

  @ApiProperty({ description: 'Última actualización de stats' })
  lastUpdated: Date;
}
