import { ApiProperty } from '@nestjs/swagger';

export class MessageResponseDto {
  @ApiProperty({
    description: 'Mensaje de confirmación o resultado de la operación',
    example: 'Correo electrónico verificado correctamente',
  })
  message: string;
}
