import { ApiProperty } from '@nestjs/swagger';

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
