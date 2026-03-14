import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { IntimacyStage } from '../providers/intimacy-progress.util';

@Schema({ timestamps: true })
export class Conversation {
  @ApiProperty({ example: '67ca8e7d1d2b9f2c3a9c6e10' })
  @Prop({ required: true, ref: 'User' })
  user: string;

  @ApiProperty({ example: '67ca8e7d1d2b9f2c3a9c6e12' })
  @Prop({ required: true, ref: 'Character' })
  character: string;

  @ApiProperty({ example: 'Late Night Feels' })
  @Prop({ required: true })
  title: string;

  @ApiProperty({ example: false })
  @Prop({ default: false })
  isArchived: boolean;

  @ApiPropertyOptional({ example: '2026-03-03T10:15:30.000Z' })
  @Prop()
  lastMessageAt: Date;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  messageCount: number;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  userMessageCount: number;

  @ApiProperty({ example: 0, minimum: 0, maximum: 100 })
  @Prop({ default: 0, min: 0, max: 100 })
  intimacyScore: number;

  @ApiProperty({
    example: 'ICEBREAKER',
    enum: ['ICEBREAKER', 'WARM', 'PLAYFUL', 'FLIRTY', 'INTIMATE'],
  })
  @Prop({
    type: String,
    enum: ['ICEBREAKER', 'WARM', 'PLAYFUL', 'FLIRTY', 'INTIMATE'],
    default: 'ICEBREAKER',
  })
  intimacyStage: IntimacyStage;

  @ApiPropertyOptional({ example: '2026-03-03T10:20:30.000Z' })
  @Prop()
  lastStageChangedAt?: Date;

  @ApiPropertyOptional({
    example:
      '- User likes open hair style.\n- User prefers late-night romantic tone.',
  })
  @Prop()
  memorySummary?: string;

  @ApiPropertyOptional({ example: '2026-03-03T10:22:00.000Z' })
  @Prop()
  memoryUpdatedAt?: Date;

  @ApiPropertyOptional({
    example: 'FEMALE',
    enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'],
  })
  @Prop({ type: String, enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] })
  personaGender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';

  @ApiPropertyOptional({ example: 24, minimum: 18, maximum: 99 })
  @Prop({ min: 18, max: 99 })
  personaAge?: number;

  @ApiPropertyOptional({ example: '2026-03-03T10:25:00.000Z' })
  @Prop()
  personaUpdatedAt?: Date;

  @ApiPropertyOptional({ example: 'Riya' })
  @Prop()
  personaName?: string;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  totalTokenCount: number;

  @ApiProperty({ example: 0.00124 })
  @Prop({ default: 0 })
  totalCost: number;

  @ApiProperty({ example: 0.00041 })
  @Prop({ default: 0 })
  userMessageCostTotal: number;

  @ApiProperty({ example: 0.00083 })
  @Prop({ default: 0 })
  assistantMessageCostTotal: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
