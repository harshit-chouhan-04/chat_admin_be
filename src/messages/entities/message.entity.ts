import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { SENDER_TYPE } from 'src/common/enums/sender-type.enum';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ timestamps: true })
export class Message {
  @Prop({
    type: Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true,
  })
  conversation: Types.ObjectId;

  @Prop({ required: true, type: String, enum: SENDER_TYPE, index: true })
  senderType: SENDER_TYPE;

  @Prop({ required: true })
  content: string;

  @Prop()
  sceneDetails?: string;

  @Prop({ required: true, min: 0 })
  tokenCount: number;

  @Prop({ required: true, min: 0 })
  cost: number;

  @Prop()
  costDisplay?: string;

  @Prop({ default: false })
  isFlagged: boolean;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ conversation: 1, createdAt: 1 });
MessageSchema.index({ senderType: 1, createdAt: -1 });
