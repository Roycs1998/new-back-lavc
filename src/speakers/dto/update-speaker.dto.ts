import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateSpeakerDto } from './create-speaker.dto';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateSpeakerDto extends PartialType(
  OmitType(CreateSpeakerDto, ['userId'] as const),
) {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'María' })
  @Transform(({ value }) => value?.trim())
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'García' })
  @Transform(({ value }) => value?.trim())
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'maria.garcia@example.com' })
  @Transform(({ value }) => value?.trim().toLowerCase())
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '+51 987 654 321' })
  @Transform(({ value }) => value?.trim())
  phone?: string;
}
