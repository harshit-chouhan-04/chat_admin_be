import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class UpdateNumberOfMessageLeftDto {
  @ApiProperty({
    description: 'Remaining number of messages the user can send',
    example: 10,
    minimum: 0,
  })
  @IsInt()
  @Min(0)
  numberOfMessageLeft: number;
}
