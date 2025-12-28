import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventStatus } from '../../common/enums/event-status.enum';
import { EventType } from '../../common/enums/event-type.enum';
import { EventLocationType } from '../../common/enums/event-location-type.enum';
import { Expose, Transform, Type } from 'class-transformer';
import { AgendaItemType } from 'src/common/enums/agenda-item-type.enum';

class ShortCompanyDto {
  @ApiProperty({
    description: 'ID de la empresa',
    example: '66bfca24c3baf17b08c9b111',
  })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Nombre', example: 'Acme Corp' })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Email contacto',
    example: 'contact@acme.com',
  })
  @Expose()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Teléfono', example: '+51 999 999 999' })
  @Expose()
  contactPhone?: string;
}

class ShortPersonDto {
  @ApiProperty({
    description: 'ID único de la persona',
    example: '64f14b1a2c4e5a1234567890',
  })
  @Expose()
  @Transform(({ obj }) => obj._id?.toString())
  id: string;

  @ApiProperty({
    description: 'Nombre de la persona',
    example: 'Juan',
  })
  @Expose()
  firstName: string;

  @ApiProperty({
    description: 'Apellido de la persona',
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
    description: 'Nombre completo de la persona (campo virtual)',
    example: 'Juan Pérez',
  })
  @Expose()
  fullName?: string;
}

class ShortSpeakerDto {
  @ApiProperty({ example: '66a9d8f7a2a0b7b3e1b01234' })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: 'Persona asociada al orador',
    type: () => ShortPersonDto,
  })
  @Expose()
  @Type(() => ShortPersonDto)
  person: ShortPersonDto;
}

class EventAddressViewDto {
  @ApiPropertyOptional({ example: 'Av. Las Flores 123' })
  @Expose()
  street?: string;

  @ApiProperty({ example: 'Lima' })
  @Expose()
  city!: string;

  @ApiPropertyOptional({ example: 'Lima' })
  @Expose()
  state?: string;

  @ApiProperty({ example: 'Perú' })
  @Expose()
  country!: string;

  @ApiPropertyOptional({ example: '15001' })
  @Expose()
  zipCode?: string;
}

class EventVirtualDetailsViewDto {
  @ApiPropertyOptional({ example: 'Zoom' })
  @Expose()
  platform?: string;

  @ApiPropertyOptional({ example: 'https://us02web.zoom.us/j/123456' })
  @Expose()
  meetingUrl?: string;

  @ApiPropertyOptional({ example: '123-456-789' })
  @Expose()
  meetingId?: string;

  @ApiPropertyOptional({ example: 'p@ss2025' })
  @Expose()
  passcode?: string;
}

class EventLocationViewDto {
  @ApiProperty({ enum: EventLocationType, example: EventLocationType.PHYSICAL })
  @Expose()
  type!: EventLocationType;

  @ApiPropertyOptional({ example: 'Centro de Convenciones de Lima' })
  @Expose()
  venue?: string;

  @ApiPropertyOptional({ type: EventAddressViewDto })
  @Type(() => EventAddressViewDto)
  @Expose()
  address?: EventAddressViewDto;

  @ApiPropertyOptional({ type: EventVirtualDetailsViewDto })
  @Type(() => EventVirtualDetailsViewDto)
  @Expose()
  virtualDetails?: EventVirtualDetailsViewDto;

  @ApiPropertyOptional({ example: 350 })
  @Expose()
  capacity?: number;
}

class EventAgendaItemViewDto {
  @ApiProperty({ example: 'Apertura y bienvenida' })
  @Expose()
  title!: string;

  @ApiPropertyOptional({ example: 'Presentación de los objetivos del evento.' })
  @Expose()
  description?: string;

  @ApiProperty({ example: '2025-10-01T14:00:00.000Z' })
  @Expose()
  startTime!: Date;

  @ApiProperty({ example: '2025-10-01T14:30:00.000Z' })
  @Expose()
  endTime!: Date;

  @ApiPropertyOptional({ example: '66b1a0c0d1e2f3a4b5c6d7e8' })
  @Expose()
  speakerId?: string;

  @ApiProperty({ enum: AgendaItemType, example: AgendaItemType.PRESENTATION })
  @Expose()
  type!: AgendaItemType;
}

class EventRegistrationViewDto {
  @ApiProperty({ example: true })
  @Expose()
  isOpen!: boolean;

  @ApiPropertyOptional({ example: '2025-09-01T00:00:00.000Z' })
  @Expose()
  opensAt?: Date;

  @ApiPropertyOptional({ example: '2025-09-30T23:59:59.000Z' })
  @Expose()
  closesAt?: Date;

  @ApiProperty({ example: false })
  @Expose()
  requiresApproval!: boolean;

  @ApiProperty({ example: 1 })
  @Expose()
  maxAttendeesPerRegistration!: number;

  @ApiProperty({ example: false })
  @Expose()
  waitlistEnabled!: boolean;
}

class EventSettingsViewDto {
  @ApiProperty({ example: false })
  @Expose()
  isPrivate!: boolean;

  @ApiProperty({ example: false })
  @Expose()
  requiresInvitation!: boolean;

  @ApiPropertyOptional({ example: 18 })
  @Expose()
  ageRestriction?: number;

  @ApiPropertyOptional({ example: 'Formal' })
  @Expose()
  dresscode?: string;

  @ApiPropertyOptional({ example: 'Ingresar por puerta 3. Traer DNI.' })
  @Expose()
  specialInstructions?: string;
}

export class EventDto {
  @ApiProperty({ example: '66c0da2b6a3aa6ed3c63e001' })
  @Expose()
  id: string;

  @ApiProperty({ example: 'Congreso Internacional de Gastroenterología 2025' })
  @Expose()
  title!: string;

  @ApiPropertyOptional({
    example: 'Evento anual con expertos internacionales.',
  })
  @Expose()
  description?: string;

  @ApiPropertyOptional({ example: 'Expertos en hepatología, NAFLD y NASH' })
  @Expose()
  shortDescription?: string;

  @ApiProperty({ enum: EventType, example: EventType.CONFERENCE })
  @Expose()
  type!: EventType;

  @ApiProperty({ enum: EventStatus, example: EventStatus.DRAFT })
  @Expose()
  eventStatus!: EventStatus;

  @ApiProperty({ example: '2025-10-01T13:00:00.000Z' })
  @Expose()
  startDate!: Date;

  @ApiProperty({ example: '2025-10-02T23:59:59.000Z' })
  @Expose()
  endDate!: Date;

  @ApiPropertyOptional({ example: 'America/Lima' })
  @Expose()
  timezone?: string;

  @ApiProperty({ example: false })
  @Expose()
  isAllDay!: boolean;

  @ApiProperty({ type: EventLocationViewDto })
  @Type(() => EventLocationViewDto)
  @Expose()
  location!: EventLocationViewDto;

  @ApiProperty({ type: [ShortSpeakerDto] })
  @Type(() => ShortSpeakerDto)
  @Expose()
  speakers!: ShortSpeakerDto[];

  @ApiPropertyOptional({ type: [EventAgendaItemViewDto] })
  @Type(() => EventAgendaItemViewDto)
  @Expose()
  agenda?: EventAgendaItemViewDto[];

  @ApiProperty({ type: EventRegistrationViewDto })
  @Type(() => EventRegistrationViewDto)
  @Expose()
  registration!: EventRegistrationViewDto;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/events/abc.jpg' })
  @Expose()
  featuredImage?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://cdn.example.com/1.jpg'],
  })
  @Expose()
  images?: string[];

  @ApiPropertyOptional({ example: 'https://youtu.be/xyz' })
  @Expose()
  videoUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['gastro', 'hepatología'] })
  @Expose()
  tags?: string[];

  @ApiPropertyOptional({ type: [String], example: ['salud', 'medicina'] })
  @Expose()
  categories?: string[];

  @ApiPropertyOptional({ example: 'congreso-gastro-2025' })
  @Expose()
  slug?: string;

  @ApiProperty({ example: '2025-08-01T10:00:00.000Z' })
  @Expose()
  createdAt!: Date;

  @ApiPropertyOptional({ type: ShortCompanyDto })
  @Type(() => ShortCompanyDto)
  @Expose()
  company?: ShortCompanyDto;

  @ApiPropertyOptional({ description: 'Razón de rechazo si aplica' })
  rejectionReason?: string;

  @ApiPropertyOptional({ type: EventSettingsViewDto })
  @Type(() => EventSettingsViewDto)
  @Expose()
  settings?: EventSettingsViewDto;
}
