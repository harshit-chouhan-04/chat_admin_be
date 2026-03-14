// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class User {
  @ApiPropertyOptional({ example: 'John Doe' })
  @Prop()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({ example: 'johndoe' })
  @Prop({ required: true, unique: true })
  username: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.jpg' })
  @Prop()
  avatarUrl: string;

  @ApiPropertyOptional({ example: 'Loves late-night conversations' })
  @Prop()
  bio: string;

  @ApiPropertyOptional({ example: true })
  @Prop()
  isEmailVerified: boolean;

  @ApiPropertyOptional({ example: false })
  @Prop()
  isMobileVerified: boolean;

  @ApiProperty({ example: 0 })
  @Prop({ default: 0 })
  credits: number;

  @ApiPropertyOptional({ example: 'sub_123' })
  @Prop()
  subscriptionId: string;

  @ApiPropertyOptional({ example: '+919999999999' })
  @Prop()
  mobile: string;

  @ApiProperty({ type: [String], example: ['67ca8e7d1d2b9f2c3a9c6e10'] })
  @Prop({ type: [String], default: [] })
  chats: string[];

  @ApiPropertyOptional({ example: '2026-03-03T10:15:30.000Z' })
  @Prop()
  lastLoginAt: Date;

  @ApiProperty({ example: 5 })
  @Prop({ default: 5, min: 0 })
  numberOfMessageLeft: number;

  @Prop({ select: false })
  passwordHash?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
