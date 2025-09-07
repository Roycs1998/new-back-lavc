import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

@Exclude()
export class EventsByStatusDto {
  @ApiPropertyOptional({ description: 'Eventos en borrador', example: 4 })
  @Expose()
  DRAFT?: number;

  @ApiPropertyOptional({ description: 'Pendientes de aprobación', example: 1 })
  @Expose()
  PENDING_APPROVAL?: number;

  @ApiPropertyOptional({ description: 'Aprobados', example: 3 })
  @Expose()
  APPROVED?: number;

  @ApiPropertyOptional({ description: 'Rechazados', example: 1 })
  @Expose()
  REJECTED?: number;

  @ApiPropertyOptional({ description: 'Publicados', example: 7 })
  @Expose()
  PUBLISHED?: number;

  @ApiPropertyOptional({ description: 'Completados', example: 6 })
  @Expose()
  COMPLETED?: number;

  @ApiPropertyOptional({ description: 'Cancelados', example: 2 })
  @Expose()
  CANCELLED?: number;
}

@Exclude()
export class CompanyEventStatsDto {
  @ApiProperty({
    description: 'Cantidad de eventos por estado',
    type: EventsByStatusDto,
  })
  @Type(() => EventsByStatusDto)
  @Expose()
  eventsByStatus!: EventsByStatusDto;

  @ApiProperty({
    description: 'Total de eventos considerados (no eliminados)',
    example: 18,
  })
  @Expose()
  totalEvents!: number;

  @ApiProperty({
    description:
      'Ingresos brutos sumados en todos los eventos (Σ sold × price)',
    example: 98350,
  })
  @Expose()
  totalRevenue!: number;

  @ApiProperty({
    description: 'Total de tickets vendidos en todos los eventos',
    example: 1243,
  })
  @Expose()
  totalTicketsSold!: number;
}
