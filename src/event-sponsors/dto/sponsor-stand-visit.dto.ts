import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

class VisitorDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  firstName: string;

  @ApiProperty()
  @Expose()
  lastName: string;

  @ApiProperty()
  @Expose()
  email: string;
}

class SponsorDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  companyName: string;
}

export class SponsorStandVisitDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty({ type: VisitorDto })
  @Expose()
  @Type(() => VisitorDto)
  visitor: VisitorDto;

  @ApiProperty({ type: SponsorDto })
  @Expose()
  @Type(() => SponsorDto)
  sponsor: SponsorDto;

  @ApiProperty()
  @Expose()
  scannedAt: Date;

  @ApiProperty()
  @Expose()
  scanType: string;

  @ApiPropertyOptional()
  @Expose()
  visitCount: number;
}
