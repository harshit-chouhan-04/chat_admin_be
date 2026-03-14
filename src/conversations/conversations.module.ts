import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Character,
  CharacterSchema,
} from 'src/characters/entities/character.entity';
import { Message, MessageSchema } from 'src/messages/entities/message.entity';
import { ConversationsController } from './conversations.controller';
import {
  Conversation,
  ConversationSchema,
} from './entities/conversation.entity';
import { ConversationsService } from './providers/conversations.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: Character.name, schema: CharacterSchema },
    ]),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService, MongooseModule],
})
export class ConversationsModule {}
