import { Transform } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { CHARACTER_VISIBILITY } from 'src/common/enums/character-visibility.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCharacterDto {
  @ApiProperty({ example: '67ca8e7d1d2b9f2c3a9c6e10' })
  @IsString()
  creator: string;

  @ApiProperty({ example: 'Riya' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Sharmili · Romantic · Deep thinker' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'Behave as a playful, empathetic character.' })
  @IsString()
  personalityPrompt: string;

  @ApiProperty({ example: 'You are roleplaying a virtual companion.' })
  @IsString()
  systemPrompt: string;

  @ApiProperty({
    type: [String],
    example: ['67ca8e7d1d2b9f2c3a9c6e11', '67ca8e7d1d2b9f2c3a9c6e12'],
  })
  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @ApiPropertyOptional({
    example: '67ca8e7d1d2b9f2c3a9c6e11',
    description: 'Deprecated: use categories[]',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: CHARACTER_VISIBILITY })
  @IsOptional()
  @IsEnum(CHARACTER_VISIBILITY)
  visibility?: CHARACTER_VISIBILITY;

  @ApiProperty({ example: false })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isNsfw: boolean;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/riya.jpg' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'alloy' })
  @IsOptional()
  @IsString()
  voiceModel?: string;
}
