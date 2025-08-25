import {
  IsOptional,
  IsPositive,
  Min,
  Max,
  IsIn,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class PaginationDto {
  @ApiPropertyOptional({
    minimum: 1,
    default: 1,
    example: 1,
    description: 'Número de página (desde 1)',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive({ message: 'La página debe ser un número positivo' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
    description: 'Cantidad de elementos por página (máximo 100)',
  })
  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsPositive({ message: 'El límite debe ser un número positivo' })
  @Min(1, { message: 'El límite mínimo es 1' })
  @Max(100, { message: 'El límite máximo es 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Campo por el cual ordenar (createdAt, name, price, etc.)',
  })
  @IsOptional()
  @IsString({ message: 'El campo sort debe ser un string' })
  sort?: string;

  @ApiPropertyOptional({
    enum: ['asc', 'desc', 'ASC', 'DESC'],
    example: 'desc',
    description: 'Dirección del ordenamiento',
  })
  @IsOptional()
  @IsIn(['asc', 'desc', 'ASC', 'DESC'], {
    message: 'Order debe ser: asc, desc, ASC o DESC',
  })
  order?: 'asc' | 'desc' | 'ASC' | 'DESC';

  get skip(): number {
    const currentPage = this.page ?? 1;
    const currentLimit = this.limit ?? 10;
    return (currentPage - 1) * currentLimit;
  }

  get mongoSort(): Record<string, 1 | -1> {
    if (!this.sort) return { createdAt: -1 };

    const direction = this.order?.toLowerCase() === 'asc' ? 1 : -1;
    return { [this.sort]: direction };
  }

  static calculateSkip(page: number = 1, limit: number = 10): number {
    return (page - 1) * limit;
  }

  static createMongoSort(
    sort?: string,
    order?: 'asc' | 'desc' | 'ASC' | 'DESC',
  ): Record<string, 1 | -1> {
    if (!sort) return { createdAt: -1 };

    const direction = order?.toLowerCase() === 'asc' ? 1 : -1;
    return { [sort]: direction };
  }
}
