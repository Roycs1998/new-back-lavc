import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CreateSpeakerDto } from './create-speaker.dto';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateSpeakerDto extends PartialType(
  OmitType(CreateSpeakerDto, ['personId'] as const),
) {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'María' })
  firstName?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'García' })
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ example: 'maria.garcia@example.com' })
  email?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: '+51 987 654 321' })
  phone?: string;
}
