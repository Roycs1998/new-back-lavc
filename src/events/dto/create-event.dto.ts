import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsBoolean,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsMongoId,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '../../common/enums/event-type.enum';

class AddressDto {
  @ApiPropertyOptional({ description: 'Street address' })
  @IsOptional()
  @IsString()
  street?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  city: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ description: 'Country' })
  @IsString()
  country: string;

  @ApiPropertyOptional({ description: 'ZIP/Postal code' })
  @IsOptional()
  @IsString()
  zipCode?: string;
}

class VirtualDetailsDto {
  @ApiPropertyOptional({ description: 'Virtual platform (Zoom, Teams, etc.)' })
  @IsOptional()
  @IsString()
  platform?: string;

  @ApiPropertyOptional({ description: 'Meeting URL' })
  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @ApiPropertyOptional({ description: 'Meeting ID' })
  @IsOptional()
  @IsString()
  meetingId?: string;

  @ApiPropertyOptional({ description: 'Meeting passcode' })
  @IsOptional()
  @IsString()
  passcode?: string;
}

class EventLocationDto {
  @ApiProperty({
    description: 'Location type',
    enum: ['physical', 'virtual', 'hybrid'],
  })
  @IsEnum(['physical', 'virtual', 'hybrid'])
  type: 'physical' | 'virtual' | 'hybrid';

  @ApiPropertyOptional({ description: 'Venue name' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiProperty({ description: 'Event address' })
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @ApiPropertyOptional({ description: 'Virtual meeting details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => VirtualDetailsDto)
  virtualDetails?: VirtualDetailsDto;

  @ApiProperty({ description: 'Maximum capacity', minimum: 1 })
  @IsNumber()
  @Min(1)
  capacity: number;
}

class AgendaItemDto {
  @ApiProperty({ description: 'Agenda item title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Agenda item description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Start time' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'End time' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Speaker ID' })
  @IsOptional()
  @IsMongoId()
  speakerId?: string;

  @ApiPropertyOptional({
    description: 'Item type',
    enum: ['presentation', 'break', 'networking', 'qa', 'other'],
  })
  @IsOptional()
  @IsEnum(['presentation', 'break', 'networking', 'qa', 'other'])
  type?: 'presentation' | 'break' | 'networking' | 'qa' | 'other';
}

class RegistrationSettingsDto {
  @ApiPropertyOptional({ description: 'Registration is open', default: true })
  @IsOptional()
  @IsBoolean()
  isOpen?: boolean;

  @ApiPropertyOptional({ description: 'Registration opens at' })
  @IsOptional()
  @IsDateString()
  opensAt?: string;

  @ApiPropertyOptional({ description: 'Registration closes at' })
  @IsOptional()
  @IsDateString()
  closesAt?: string;

  @ApiPropertyOptional({ description: 'Requires approval', default: false })
  @IsOptional()
  @IsBoolean()
  requiresApproval?: boolean;

  @ApiPropertyOptional({
    description: 'Max attendees per registration',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  maxAttendeesPerRegistration?: number;

  @ApiPropertyOptional({ description: 'Enable waitlist', default: false })
  @IsOptional()
  @IsBoolean()
  waitlistEnabled?: boolean;
}

class EventSettingsDto {
  @ApiPropertyOptional({ description: 'Private event', default: false })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @ApiPropertyOptional({ description: 'Requires invitation', default: false })
  @IsOptional()
  @IsBoolean()
  requiresInvitation?: boolean;

  @ApiPropertyOptional({ description: 'Minimum age requirement' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ageRestriction?: number;

  @ApiPropertyOptional({ description: 'Dress code' })
  @IsOptional()
  @IsString()
  dresscode?: string;

  @ApiPropertyOptional({ description: 'Special instructions' })
  @IsOptional()
  @IsString()
  specialInstructions?: string;
}

export class CreateEventDto {
  @ApiProperty({ description: 'Event title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Event description' })
  @IsOptional()
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Short description for listings' })
  @IsOptional()
  @IsString()
  shortDescription?: string;

  @ApiProperty({ description: 'Company ID' })
  @IsMongoId()
  companyId: string;

  @ApiProperty({ description: 'Event type', enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty({ description: 'Event start date and time' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Event end date and time' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Timezone (e.g., "America/Lima")' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'All-day event', default: false })
  @IsOptional()
  @IsBoolean()
  isAllDay?: boolean;

  @ApiProperty({ description: 'Event location details' })
  @ValidateNested()
  @Type(() => EventLocationDto)
  location: EventLocationDto;

  @ApiPropertyOptional({ description: 'Speaker IDs' })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  speakers?: string[];

  @ApiPropertyOptional({ description: 'Event agenda' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgendaItemDto)
  agenda?: AgendaItemDto[];

  @ApiPropertyOptional({ description: 'Registration settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => RegistrationSettingsDto)
  registration?: RegistrationSettingsDto;

  @ApiPropertyOptional({ description: 'Featured image URL' })
  @IsOptional()
  @IsString()
  featuredImage?: string;

  @ApiPropertyOptional({ description: 'Additional image URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];

  @ApiPropertyOptional({ description: 'Video URL' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Event tags' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Event categories' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'URL slug (auto-generated if not provided)',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ description: 'Event settings' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EventSettingsDto)
  settings?: EventSettingsDto;
}
