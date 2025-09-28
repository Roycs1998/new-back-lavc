import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CompanyType } from 'src/common/enums/company-type.enum';

class AddressDto {
  @ApiPropertyOptional({
    description: 'Calle o avenida (dirección fiscal o comercial)',
    example: 'Av. Arequipa 1234',
  })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({
    description: 'Ciudad',
    example: 'Lima',
  })
  @IsString()
  city!: string;

  @ApiPropertyOptional({
    description: 'Región/Provincia/Estado',
    example: 'Lima',
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    description: 'País',
    example: 'Perú',
  })
  @IsString()
  country!: string;

  @ApiPropertyOptional({
    description: 'Código postal',
    example: '15046',
  })
  @IsOptional()
  @IsString()
  zipCode?: string;
}

class CompanySettingsDto {
  @ApiPropertyOptional({
    description: 'Permite subir ponentes (speakers) a la plataforma',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  canUploadSpeakers?: boolean;

  @ApiPropertyOptional({
    description: 'Permite crear eventos en la plataforma',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  canCreateEvents?: boolean;

  @ApiPropertyOptional({
    description: 'Número máximo de eventos que la empresa puede crear por mes',
    example: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxEventsPerMonth?: number;
}

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Nombre comercial o razón social de la empresa',
    example: 'Acme Events S.A.C.',
  })
  @IsString()
  name!: string;

  @ApiPropertyOptional({
    description: 'Descripción breve de la empresa',
    example: 'Organizador de eventos y conferencias tecnológicas.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'URL del logotipo de la empresa',
    example: 'https://cdn.example.com/logos/acme.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Sitio web oficial de la empresa',
    example: 'https://www.acme-events.com',
  })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiProperty({
    description: 'Correo electrónico de contacto principal',
    example: 'contacto@acme-events.com',
  })
  @IsOptional()
  contactEmail?: string;

  @ApiPropertyOptional({
    description: 'Teléfono de contacto',
    example: '+51 999 999 999',
  })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Dirección de la empresa',
    type: () => AddressDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({
    description: 'Tipo de empresa',
    enum: CompanyType,
    example: CompanyType.EVENT_ORGANIZER,
    default: CompanyType.EVENT_ORGANIZER,
  })
  @IsOptional()
  @IsEnum(CompanyType)
  type?: CompanyType;

  @ApiPropertyOptional({
    description: 'Tasa de comisión aplicada (rango 0.00 a 1.00)',
    minimum: 0,
    maximum: 1,
    example: 0.15,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  commissionRate?: number;

  @ApiPropertyOptional({
    description: 'Configuraciones específicas de la empresa',
    type: () => CompanySettingsDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CompanySettingsDto)
  settings?: CompanySettingsDto;
}
