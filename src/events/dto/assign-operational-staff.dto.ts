import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignOperationalStaffDto {
  @ApiProperty({
    description: 'ID del usuario a asignar como staff operativo',
    example: '507f1f77bcf86cd799439011',
  })
  @IsMongoId()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'Notas sobre la asignación',
    example: 'Responsable de check-in en entrada principal',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
