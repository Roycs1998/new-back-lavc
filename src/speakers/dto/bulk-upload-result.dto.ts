import { ApiProperty } from '@nestjs/swagger';

export class BulkUploadResultDto {
  @ApiProperty({ description: 'Upload job ID for tracking' })
  jobId: string;

  @ApiProperty({ description: 'Total number of records processed' })
  totalRecords: number;

  @ApiProperty({ description: 'Number of successful imports' })
  successful: number;

  @ApiProperty({ description: 'Number of failed imports' })
  failed: number;

  @ApiProperty({ description: 'Array of error messages for failed imports' })
  errors: string[];

  @ApiProperty({ description: 'Array of successfully created speaker IDs' })
  createdSpeakers: string[];

  @ApiProperty({ description: 'Processing status' })
  status: 'processing' | 'completed' | 'failed';

  @ApiProperty({ description: 'File name that was processed' })
  fileName: string;

  @ApiProperty({ description: 'User who uploaded the file' })
  uploadedBy: string;

  @ApiProperty({ description: 'Upload timestamp' })
  uploadedAt: Date;
}
