import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CHARACTER_VISIBILITY } from 'src/common/enums/character-visibility.enum';
import {
  CharacterGender,
  CharacterSexuality,
} from '../entities/character.entity';

export class CreateCharacterDto {
  @ApiProperty({ example: '67ca8e7d1d2b9f2c3a9c6e10' })
  @IsMongoId()
  creator: string;

  @ApiProperty({ example: 'Riya' })
  @IsString()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 26 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(18)
  age?: number;

  @ApiPropertyOptional({ enum: CharacterGender })
  @IsOptional()
  @IsEnum(CharacterGender)
  gender?: CharacterGender;

  @ApiPropertyOptional({ enum: CharacterSexuality })
  @IsOptional()
  @IsEnum(CharacterSexuality)
  sexuality?: CharacterSexuality;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  personalityPrompt: string;

  @ApiProperty()
  @IsString()
  systemPrompt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  scenario?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  greetingMessage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationStyle?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  categories?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  voiceModel?: string;

  @ApiPropertyOptional({ enum: CHARACTER_VISIBILITY })
  @IsOptional()
  @IsEnum(CHARACTER_VISIBILITY)
  visibility?: CHARACTER_VISIBILITY;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  isNsfw?: boolean;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
