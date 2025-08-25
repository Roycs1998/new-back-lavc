import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidObjectId } from 'src/common/validators/is-valid-object-id.validator';

export class GenerateQRDto {
  @ApiProperty({
    description: 'ID del ticket para generar el código QR',
    example: '507f1f77bcf86cd799439011',
  })
  @IsNotEmpty({ message: 'El ID del ticket es requerido' })
  @IsValidObjectId({ message: 'El ID del ticket debe ser un ObjectId válido' })
  ticketId: string;
}
