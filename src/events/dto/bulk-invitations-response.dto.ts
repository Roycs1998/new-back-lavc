import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { SponsorInvitationDto } from './sponsor-invitation.dto';

export class BulkInvitationsResponseDto {
  @ApiProperty({
    description: 'Indica si la operación fue exitosa',
    example: true,
  })
  @Expose()
  success!: boolean;

  @ApiProperty({
    description: 'Cantidad de invitaciones creadas',
    example: 10,
  })
  @Expose()
  created!: number;

  @ApiProperty({
    description: 'Array de invitaciones creadas',
    type: [SponsorInvitationDto],
  })
  @Expose()
  invitations!: SponsorInvitationDto[];

  @ApiProperty({
    description: 'Información sobre límites y cuota disponible',
    example: {
      remaining: 40,
      total: 50,
    },
  })
  @Expose()
  limits!: {
    remaining: number;
    total: number;
  };
}
