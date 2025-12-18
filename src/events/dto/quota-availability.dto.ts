import { ApiProperty } from '@nestjs/swagger';

export class QuotaAvailabilityDto {
  @ApiProperty({
    description: 'Indica si hay cuota disponible',
    example: true,
  })
  available!: boolean;

  @ApiProperty({
    description: 'Cuota total asignada',
    example: 10,
  })
  total!: number;

  @ApiProperty({
    description: 'Cuota ya utilizada',
    example: 7,
  })
  used!: number;

  @ApiProperty({
    description: 'Cuota disponible restante',
    example: 3,
  })
  remaining!: number;
}
