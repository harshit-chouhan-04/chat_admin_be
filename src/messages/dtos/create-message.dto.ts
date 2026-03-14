import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: '67ca8e7d1d2b9f2c3a9c6e13' })
  @IsString()
  @IsNotEmpty()
  chatId: string;

  @ApiProperty({ example: 'Hey, tum kya kar rahi ho?' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({
    required: false,
    example: 'Rainy rooftop at midnight with city lights in background',
  })
  @IsOptional()
  @IsString()
  sceneDetails?: string;
}
