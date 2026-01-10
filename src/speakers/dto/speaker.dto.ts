import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { Currency } from 'src/common/enums/currency.enum';
import { EntityStatus } from 'src/common/enums/entity-status.enum';
import { UploadSource } from '../entities/speaker.entity';

class ShortCompanyDto {
  @ApiProperty({
    description: 'ID único de la empresa',
    example: '64f14b1a2c4e5a1234567891',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Nombre de la empresa',
    example: 'Acme Corp',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    description: 'Correo de contacto de la empresa',
    example: 'contact@acme.com',
  })
  @Expose()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto de la empresa',
    example: '+51999999999',
  })
  @Expose()
  contactPhone?: string;
}

class ShortPersonDto {
  @ApiProperty({
    description: 'ID único de la persona',
    example: '64f14b1a2c4e5a1234567890',
  })
  @Expose()
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

  @ApiPropertyOptional({
    description: 'Correo electrónico de la persona',
    example: 'juan.perez@example.com',
  })
  @Expose()
  email?: string;

  @ApiPropertyOptional({
    description: 'URL del avatar/foto de la persona',
    example: 'https://cdn.ejemplo.com/upload/speakers/123456-uuid-photo.jpg',
  })
  @Expose()
  avatar?: string;
}

class SocialMediaViewDto {
  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/jdoe' })
  @Expose()
  linkedin?: string;

  @ApiPropertyOptional({ example: 'https://twitter.com/jdoe' })
  @Expose()
  twitter?: string;

  @ApiPropertyOptional({ example: 'https://jdoe.dev' })
  @Expose()
  website?: string;

  @ApiPropertyOptional({ example: 'https://github.com/jdoe' })
  @Expose()
  github?: string;
}

class AudienceSizeViewDto {
  @ApiPropertyOptional({ example: 50 })
  @Expose()
  min?: number;

  @ApiPropertyOptional({ example: 300 })
  @Expose()
  max?: number;
}

@Exclude()
export class SpeakerDto {
  @ApiProperty({ example: '66a9d8f7a2a0b7b3e1b01234' })
  @Expose()
  id: string;

  @ApiPropertyOptional({
    description: 'Persona asociada al usuario',
    type: () => ShortPersonDto,
  })
  @Expose()
  @Type(() => ShortPersonDto)
  person: ShortPersonDto;

  @ApiPropertyOptional({
    description: 'Empresa asociada al usuario',
    example: ShortCompanyDto,
  })
  @Type(() => ShortCompanyDto)
  @Expose()
  company?: ShortCompanyDto;

  @ApiProperty({ example: 'Gastroenterología' })
  @Expose()
  specialty: string;

  @ApiPropertyOptional({
    example: 'Especialista en hígado graso (NAFLD/NASH).',
  })
  @Expose()
  biography?: string;

  @ApiProperty({ example: 8 })
  @Expose()
  yearsExperience: number;

  @ApiPropertyOptional({ type: [String], example: ['ACLS', 'BLS'] })
  @Expose()
  certifications?: string[];

  @ApiPropertyOptional({ example: 120 })
  @Expose()
  hourlyRate?: number;

  @ApiPropertyOptional({ enum: Currency, example: Currency.PEN })
  @Expose()
  currency?: Currency;

  @ApiPropertyOptional({ type: SocialMediaViewDto })
  @Type(() => SocialMediaViewDto)
  @Expose()
  socialMedia?: SocialMediaViewDto;

  @ApiProperty({ enum: UploadSource, example: UploadSource.MANUAL })
  @Expose()
  uploadedVia: UploadSource;

  @ApiPropertyOptional({ type: [String], example: ['es', 'en'] })
  @Expose()
  languages?: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['hepatología', 'hígado graso'],
  })
  @Expose()
  topics?: string[];

  @ApiPropertyOptional({ type: AudienceSizeViewDto })
  @Type(() => AudienceSizeViewDto)
  @Expose()
  audienceSize?: AudienceSizeViewDto;

  @ApiPropertyOptional({ example: 'Notas internas del speaker' })
  @Expose()
  notes?: string;

  @ApiProperty({ enum: EntityStatus, example: EntityStatus.ACTIVE })
  @Expose()
  entityStatus: EntityStatus;

  @ApiProperty({ example: '2025-09-05T17:32:15.000Z' })
  @Expose()
  createdAt: Date;
}
