import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { IntimacyStage } from '../providers/intimacy-progress.util';

export type ConversationDocument = HydratedDocument<Conversation>;

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Character', required: true, index: true })
  character: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ default: false, index: true })
  isArchived: boolean;

  @Prop({ default: 0, min: 0 })
  messageCount: number;

  @Prop({ default: 0, min: 0 })
  userMessageCount: number;

  @Prop({ default: 0, min: 0, max: 100 })
  intimacyScore: number;

  @Prop({
    type: String,
    enum: ['ICEBREAKER', 'WARM', 'PLAYFUL', 'FLIRTY', 'INTIMATE'],
    default: 'ICEBREAKER',
  })
  intimacyStage: IntimacyStage;

  @Prop({ default: 0, min: 0 })
  totalTokenCount: number;

  @Prop({ default: 0, min: 0 })
  totalCost: number;

  @Prop()
  personaName?: string;

  @Prop({ min: 18, max: 99 })
  personaAge?: number;

  @Prop({ type: String, enum: ['MALE', 'FEMALE', 'NON_BINARY', 'OTHER'] })
  personaGender?: 'MALE' | 'FEMALE' | 'NON_BINARY' | 'OTHER';

  @Prop()
  memorySummary?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  memoryUpdatedAt?: Date;

  @Prop()
  personaUpdatedAt?: Date;

  @Prop()
  lastStageChangedAt?: Date;

  @Prop({ default: 0 })
  userMessageCostTotal: number;

  @Prop({ default: 0 })
  assistantMessageCostTotal: number;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

ConversationSchema.index({ user: 1, character: 1, isArchived: 1 });
ConversationSchema.index({ user: 1, updatedAt: -1 });
ConversationSchema.index({ character: 1, updatedAt: -1 });
