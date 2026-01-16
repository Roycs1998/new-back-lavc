import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type, Transform } from 'class-transformer';
import { ParticipantType } from '../../common/enums/participant-type.enum';

class ShortUserDto {
  @ApiProperty({
    description: 'ID del usuario',
    example: '66c0da2b6a3aa6ed3c63e002',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Email del usuario',
    example: 'usuario@example.com',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    description: 'Nombre del usuario',
    example: 'Juan',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Apellido del usuario',
    example: 'Pérez',
  })
  @Expose()
  lastName: string;

  @ApiPropertyOptional({
    description: 'Número de teléfono',
    example: '+51987654321',
  })
  @Expose()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Nombre completo del usuario (campo virtual)',
    example: 'Juan Pérez',
  })
  @Expose()
  @Transform(({ obj }) => {
    const firstName = obj.firstName;
    const lastName = obj.lastName;
    return `${firstName ?? ''} ${lastName ?? ''}`.trim() || undefined;
  })
  fullName?: string;
}

class ShortCompanyDto {
  @ApiProperty({
    description: 'ID de la empresa',
    example: '66bfca24c3baf17b08c9b111',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'TechCorp Solutions',
  })
  @Expose()
  name!: string;

  @ApiPropertyOptional({
    description: 'RUC de la empresa',
    example: '20123456789',
  })
  @Expose()
  ruc?: string;

  @ApiPropertyOptional({
    description: 'Email de la empresa',
    example: 'contacto@techcorp.com',
  })
  @Expose()
  email?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de la empresa',
    example: '+51 1 234 5678',
  })
  @Expose()
  phone?: string;
}

class ShortSponsorDto {
  @ApiProperty({
    description: 'ID del patrocinador',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID de la empresa',
    example: '66bfca24c3baf17b08c9b111',
  })
  @Expose()
  companyId!: string;

  @ApiPropertyOptional({
    description: 'Cuota de staff',
    example: 5,
  })
  @Expose()
  staffQuota?: number;

  @ApiPropertyOptional({
    description: 'Cuota de invitados',
    example: 10,
  })
  @Expose()
  guestQuota?: number;

  @ApiPropertyOptional({
    description: 'Cuota de becados',
    example: 3,
  })
  @Expose()
  scholarshipQuota?: number;

  @ApiPropertyOptional({
    description: 'Nivel de patrocinio',
    example: 'gold',
  })
  @Expose()
  sponsorshipLevel?: string;

  @ApiPropertyOptional({
    description: 'Información completa de la empresa',
    type: ShortCompanyDto,
  })
  @Type(() => ShortCompanyDto)
  @Expose()
  company?: ShortCompanyDto;
}

class ShortSpeakerDto {
  @ApiProperty({
    description: 'ID del speaker',
    example: '66a9d8f7a2a0b7b3e1b01234',
  })
  @Expose()
  id!: string;

  @ApiPropertyOptional({
    description: 'Biografía del speaker',
    example: 'Veterinario especializado en cirugía...',
  })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({
    description: 'Especialidad del speaker',
    example: 'Cirugía Veterinaria',
  })
  @Expose()
  specialty?: string;

  @ApiPropertyOptional({
    description: 'Años de experiencia',
    example: 15,
  })
  @Expose()
  yearsExperience?: number;

  @ApiPropertyOptional({
    description: 'Información del usuario asociado al speaker',
    type: ShortUserDto,
  })
  @Type(() => ShortUserDto)
  @Expose()
  user?: ShortUserDto;

  @ApiPropertyOptional({
    description: 'Empresa asociada al speaker',
    type: ShortCompanyDto,
  })
  @Type(() => ShortCompanyDto)
  @Expose()
  company?: ShortCompanyDto;
}

export class EventParticipantDto {
  @ApiProperty({
    description: 'ID del participante',
    example: '66c0da2b6a3aa6ed3c63e005',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    description: 'ID del evento',
    example: '66c0da2b6a3aa6ed3c63e001',
  })
  @Expose()
  eventId!: string;

  @ApiProperty({
    description: 'ID del usuario participante',
    example: '66c0da2b6a3aa6ed3c63e002',
  })
  @Expose()
  userId!: string;

  @ApiPropertyOptional({
    description: 'ID del patrocinador (si aplica)',
    example: '66c0da2b6a3aa6ed3c63e004',
  })
  @Expose()
  eventSponsorId?: string;

  @ApiProperty({
    description: 'Tipo de participante',
    enum: ParticipantType,
    example: ParticipantType.STAFF,
  })
  @Expose()
  participantType!: ParticipantType;

  @ApiProperty({
    description: 'Fecha de registro',
    example: '2025-09-15T10:00:00.000Z',
  })
  @Expose()
  registeredAt!: Date;

  @ApiPropertyOptional({
    description: 'ID del ticket generado',
    example: '66c0da2b6a3aa6ed3c63e006',
  })
  @Expose()
  ticketId?: string;

  @ApiProperty({
    description: 'Estado activo del participante',
    example: true,
  })
  @Expose()
  isActive!: boolean;

  @ApiPropertyOptional({
    description: 'Fecha de cancelación',
    example: '2025-09-20T15:30:00.000Z',
  })
  @Expose()
  cancelledAt?: Date;

  @ApiPropertyOptional({
    description: 'Información del usuario',
    type: ShortUserDto,
  })
  @Type(() => ShortUserDto)
  @Expose()
  user?: ShortUserDto;

  @ApiPropertyOptional({
    description: 'Información del patrocinador con empresa',
    type: ShortSponsorDto,
  })
  @Type(() => ShortSponsorDto)
  @Expose()
  sponsor?: ShortSponsorDto;

  @ApiPropertyOptional({
    description: 'Información del speaker (solo para tipo SPEAKER)',
    type: ShortSpeakerDto,
  })
  @Type(() => ShortSpeakerDto)
  @Expose()
  speaker?: ShortSpeakerDto;

  @ApiProperty({
    description: 'Fecha de creación',
    example: '2025-09-15T10:00:00.000Z',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    description: 'Fecha de última actualización',
    example: '2025-09-15T10:00:00.000Z',
  })
  @Expose()
  updatedAt!: Date;
}
