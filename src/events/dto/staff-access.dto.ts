import { ApiProperty } from '@nestjs/swagger';

export class StaffAccessDto {
  @ApiProperty({
    description: 'Indica si el usuario tiene acceso al panel de staff',
    example: true,
  })
  hasAccess!: boolean;

  @ApiProperty({
    description: 'Indica si el usuario está registrado como staff',
    example: true,
  })
  isStaff!: boolean;

  @ApiProperty({
    description: 'Indica si el evento está actualmente activo',
    example: true,
  })
  isEventActive!: boolean;
}
