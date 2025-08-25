import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1, description: 'Página actual' })
  currentPage: number;

  @ApiProperty({ example: 10, description: 'Elementos por página' })
  perPage: number;

  @ApiProperty({ example: 100, description: 'Total de elementos' })
  totalItems: number;

  @ApiProperty({ example: 10, description: 'Total de páginas' })
  totalPages: number;

  @ApiProperty({ example: true, description: '¿Hay página anterior?' })
  hasPreviousPage: boolean;

  @ApiProperty({ example: true, description: '¿Hay página siguiente?' })
  hasNextPage: boolean;

  constructor(page: number, limit: number, totalItems: number) {
    this.currentPage = page;
    this.perPage = limit;
    this.totalItems = totalItems;
    this.totalPages = Math.ceil(totalItems / limit);
    this.hasPreviousPage = page > 1;
    this.hasNextPage = page < this.totalPages;
  }
}
