import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { EventStatus } from 'src/common/enums/event-status.enum';

export class EventStatsEventInfoDto {
  @ApiProperty({
    description: 'Título del evento',
    example: 'Congreso Internacional de Gastroenterología 2025',
  })
  title!: string;

  @ApiProperty({
    description: 'Estado actual del evento',
    enum: EventStatus,
    example: EventStatus.PUBLISHED,
  })
  status!: EventStatus;

  @ApiProperty({
    description: 'Fecha/hora de inicio (ISO)',
    example: '2025-10-01T13:00:00.000Z',
  })
  startDate!: Date;

  @ApiProperty({
    description: 'Fecha/hora de fin (ISO)',
    example: '2025-10-02T23:59:59.000Z',
  })
  endDate!: Date;
}

@Exclude()
export class EventTicketStatsDto {
  @ApiProperty({
    description: 'Capacidad total (suma de todos los tipos de ticket)',
    example: 500,
  })
  totalCapacity!: number;

  @ApiProperty({
    description: 'Tickets vendidos (suma de todos los tipos de ticket)',
    example: 275,
  })
  totalSold!: number;

  @ApiProperty({
    description: 'Ingresos brutos = Σ(sold × price)',
    example: 27500,
  })
  totalRevenue!: number;

  @ApiProperty({
    description: 'Cantidad de tipos de ticket definidos',
    example: 3,
  })
  ticketTypes!: number;

  @ApiProperty({
    description: 'Tickets disponibles = totalCapacity - totalSold',
    example: 225,
  })
  availableTickets!: number;

  @ApiProperty({
    description: 'Porcentaje vendido (0-100, con 2 decimales)',
    example: 55.0,
  })
  soldPercentage!: number;
}

@Exclude()
export class EventStatsDto {
  @ApiProperty({
    description: 'Resumen del evento',
    type: EventStatsEventInfoDto,
  })
  @Type(() => EventStatsEventInfoDto)
  event!: EventStatsEventInfoDto;

  @ApiProperty({
    description: 'Estadísticas de tickets',
    type: EventTicketStatsDto,
  })
  @Type(() => EventTicketStatsDto)
  tickets!: EventTicketStatsDto;
}
