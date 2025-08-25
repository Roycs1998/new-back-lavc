import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto<T> {
  @ApiProperty({
    description: 'Lista de elementos de la página actual',
    example: [],
  })
  data: T[];

  @ApiProperty({
    description: 'Total de elementos encontrados',
    example: 150,
  })
  totalItems: number;

  @ApiProperty({
    description: 'Número total de páginas calculadas',
    example: 15,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Número de la página actual',
    example: 3,
  })
  currentPage: number;

  @ApiProperty({
    description: '¿Existe una página siguiente?',
    example: true,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: '¿Existe una página anterior?',
    example: false,
  })
  hasPreviousPage: boolean;
}
