import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsMongoId } from 'class-validator';

export class SyncSpeakersDto {
  @ApiProperty({
    description: 'Array de IDs de speakers del evento',
    example: ['66a9d8f7a2a0b7b3e1b01234', '66a9d8f7a2a0b7b3e1b01235'],
    type: [String],
  })
  @IsArray({ message: 'speakers debe ser un array' })
  @IsMongoId({
    each: true,
    message: 'Cada speaker ID debe ser un ObjectId válido',
  })
  speakers!: string[];
}
