import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CHARACTER_VISIBILITY } from 'src/common/enums/character-visibility.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CHARACTER_GENDER {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
}

export enum CHARACTER_SEXUALITY {
  STRAIGHT = 'straight',
  BISEXUAL = 'bisexual',
  GAY = 'gay',
  LESBIAN = 'lesbian',
  PANSEXUAL = 'pansexual',
}

@Schema({ timestamps: true })
export class Character {
  @ApiProperty({ example: '67ca8e7d1d2b9f2c3a9c6e10' })
  @Prop({ required: true, ref: 'User' })
  creator: string;

  @ApiProperty({ example: 'Riya' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ example: 'riya' })
  @Prop({ unique: true })
  slug: string;

  // NEW: Age
  @ApiProperty({ example: 26 })
  @Prop({ required: true })
  age: number;

  // NEW: Gender
  @ApiProperty({
    enum: CHARACTER_GENDER,
    example: CHARACTER_GENDER.FEMALE,
  })
  @Prop({
    required: true,
    enum: CHARACTER_GENDER,
    type: String,
  })
  gender: CHARACTER_GENDER;

  // NEW: Sexuality
  @ApiProperty({
    enum: CHARACTER_SEXUALITY,
    example: CHARACTER_SEXUALITY.STRAIGHT,
  })
  @Prop({
    required: true,
    enum: CHARACTER_SEXUALITY,
    type: String,
  })
  sexuality: CHARACTER_SEXUALITY;

  @ApiPropertyOptional({ example: 'Sharmili · Romantic · Deep thinker' })
  @Prop()
  description: string;

  @ApiProperty({ example: 'Behave as a playful, empathetic character.' })
  @Prop({ required: true })
  personalityPrompt: string;

  @ApiProperty({ example: 'You are roleplaying a virtual companion.' })
  @Prop({ required: true })
  systemPrompt: string;

  @ApiProperty({
    type: [String],
    example: ['67ca8e7d1d2b9f2c3a9c6e11', '67ca8e7d1d2b9f2c3a9c6e12'],
  })
  @Prop({ required: true, ref: 'Category', type: [String], default: [] })
  categories: string[];

  @ApiProperty({
    enum: CHARACTER_VISIBILITY,
    example: CHARACTER_VISIBILITY.PUBLIC,
  })
  @Prop({
    required: true,
    enum: CHARACTER_VISIBILITY,
    default: CHARACTER_VISIBILITY.PUBLIC,
    type: String,
  })
  visibility: CHARACTER_VISIBILITY;

  @ApiProperty({ example: false })
  @Prop({ required: true })
  isNsfw: boolean;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/riya.jpg' })
  @Prop()
  avatarUrl: string;

  @ApiPropertyOptional({ example: 'alloy' })
  @Prop()
  voiceModel: string;

  @ApiPropertyOptional({
    example:
      'It is late at night. The house is quiet and you are chatting privately online.',
  })
  @Prop()
  scenario: string;

  @ApiPropertyOptional({
    example: 'Hey… it’s pretty quiet tonight. What are you doing awake?',
  })
  @Prop()
  greetingMessage: string;

  @ApiPropertyOptional({
    example:
      'Playful teasing, emotional curiosity, natural texting style responses.',
  })
  @Prop()
  conversationStyle: string;

  @ApiPropertyOptional({
    example: [
      {
        user: 'What are you doing?',
        character: 'Just relaxing… nights like this feel strangely peaceful.',
      },
    ],
  })
  @Prop({
    type: [
      {
        user: String,
        character: String,
      },
    ],
    default: [],
  })
  exampleDialogues: { user: string; character: string }[];

  @ApiProperty({ type: [String], example: [] })
  @Prop({ type: [String], default: [], ref: 'Conversation' })
  chats: string[];

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  rating: number;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  ratingCount: number;

  @ApiProperty({ example: true })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isDeleted: boolean;
}

export const CharacterSchema = SchemaFactory.createForClass(Character);
