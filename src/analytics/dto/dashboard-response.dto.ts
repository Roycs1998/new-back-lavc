import { ApiProperty } from '@nestjs/swagger';

export class MetricDataPoint {
  @ApiProperty()
  date: string;

  @ApiProperty()
  value: number;

  @ApiProperty({ required: false })
  label?: string;
}

export class KPICard {
  @ApiProperty()
  title: string;

  @ApiProperty()
  value: number;

  @ApiProperty()
  change: number;

  @ApiProperty()
  format: 'currency' | 'number' | 'percentage';

  @ApiProperty()
  icon: string;

  @ApiProperty()
  color: string;
}

export class ChartData {
  @ApiProperty()
  title: string;

  @ApiProperty()
  type: 'line' | 'bar' | 'pie' | 'doughnut';

  @ApiProperty({ type: [MetricDataPoint] })
  data: MetricDataPoint[];

  @ApiProperty({ required: false })
  labels?: string[];

  @ApiProperty({ required: false })
  datasets?: any[];
}

export class DashboardResponseDto {
  @ApiProperty({ type: [KPICard] })
  kpis: KPICard[];

  @ApiProperty({ type: [ChartData] })
  charts: ChartData[];

  @ApiProperty()
  lastUpdated: Date;

  @ApiProperty()
  dateRange: {
    startDate: Date;
    endDate: Date;
    period: string;
  };
}
