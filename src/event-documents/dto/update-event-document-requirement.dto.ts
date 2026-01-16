import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateEventDocumentRequirementDto } from './create-event-document-requirement.dto';

export class UpdateEventDocumentRequirementDto extends PartialType(
  CreateEventDocumentRequirementDto,
) {
  @ApiPropertyOptional({
    description: 'Indica si el requisito está activo',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
