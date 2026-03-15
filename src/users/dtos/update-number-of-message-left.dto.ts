import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsMongoId, IsOptional, Min } from 'class-validator';

export class UpdateNumberOfMessageLeftDto {
  @ApiProperty({
    description: 'Remaining number of messages the user can send',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  numberOfMessageLeft: number;

  @ApiPropertyOptional({
    description: 'Plan id for which to create an invoice',
    example: '65f1c2a9b7a2f5d8c3e4a1b2',
  })
  @IsOptional()
  @IsMongoId()
  planId?: string;
}
