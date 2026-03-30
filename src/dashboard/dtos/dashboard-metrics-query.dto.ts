import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class DashboardMetricsQueryDto {
  @ApiPropertyOptional({
    description:
      'Start date (inclusive) for the comparison window (ISO-8601). Defaults to last 30 days.',
    example: '2026-03-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @ApiPropertyOptional({
    description:
      'End date (exclusive) for the comparison window (ISO-8601). Defaults to now.',
    example: '2026-04-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  endDate?: string;
}
