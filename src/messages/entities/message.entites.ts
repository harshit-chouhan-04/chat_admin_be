// src/messages/message.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { SENDER_TYPE } from 'src/common/enums/sender-type.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class Message {
  @ApiProperty({ example: '67ca8e7d1d2b9f2c3a9c6e13' })
  @Prop({ required: true, ref: 'Conversation' })
  conversation: string;

  @ApiProperty({ enum: SENDER_TYPE, example: SENDER_TYPE.USER })
  @Prop({ required: true, enum: SENDER_TYPE, type: String })
  senderType: SENDER_TYPE;

  @ApiProperty({ example: 'Hello there!' })
  @Prop({ required: true })
  content: string;

  @ApiPropertyOptional({
    example: 'Rainy rooftop at midnight with city lights in background',
  })
  @Prop()
  sceneDetails?: string;

  @ApiProperty({ example: 42 })
  @Prop({ required: true })
  tokenCount: number;

  @ApiProperty({ example: 0.00031 })
  @Prop({ required: true })
  cost: number;

  @ApiPropertyOptional({ example: '0.00031' })
  @Prop()
  costDisplay?: string;

  @ApiProperty({ example: false })
  @Prop({ required: true, default: false })
  isFlagged: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
