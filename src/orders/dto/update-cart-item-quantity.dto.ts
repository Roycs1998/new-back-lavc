import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateCartItemQuantityDto {
  @ApiProperty({
    description:
      'Nueva cantidad para el ítem. Si envías 0, el ítem se elimina del carrito.',
    example: 3,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  quantity!: number;
}
