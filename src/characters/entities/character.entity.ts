import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CHARACTER_VISIBILITY } from 'src/common/enums/character-visibility.enum';

export enum CharacterGender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non_binary',
  OTHER = 'other',
}

export enum CharacterSexuality {
  STRAIGHT = 'straight',
  BISEXUAL = 'bisexual',
  GAY = 'gay',
  LESBIAN = 'lesbian',
  PANSEXUAL = 'pansexual',
  ASEXUAL = 'asexual',
  OTHER = 'other',
}

export type CharacterDocument = HydratedDocument<Character>;

@Schema({ timestamps: true })
export class Character {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  creator: Types.ObjectId;

  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  slug: string;

  @Prop({ min: 18 })
  age?: number;

  @Prop({ type: String, enum: CharacterGender })
  gender?: CharacterGender;

  @Prop({ type: String, enum: CharacterSexuality })
  sexuality?: CharacterSexuality;

  @Prop()
  description?: string;

  @Prop({ required: true })
  personalityPrompt: string;

  @Prop({ required: true })
  systemPrompt: string;

  @Prop()
  scenario?: string;

  @Prop()
  greetingMessage?: string;

  @Prop()
  conversationStyle?: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Category' }], default: [] })
  categories: Types.ObjectId[];

  @Prop()
  avatarUrl?: string;

  @Prop()
  voiceModel?: string;

  @Prop({
    type: String,
    enum: CHARACTER_VISIBILITY,
    default: CHARACTER_VISIBILITY.PUBLIC,
  })
  visibility: CHARACTER_VISIBILITY;

  @Prop({ default: false })
  isNsfw: boolean;

  @Prop({ default: 0, min: 0 })
  rating: number;

  @Prop({ default: 0, min: 0 })
  ratingCount: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const CharacterSchema = SchemaFactory.createForClass(Character);

CharacterSchema.index({ creator: 1, isDeleted: 1 });
CharacterSchema.index({ categories: 1, isActive: 1, isNsfw: 1 });
