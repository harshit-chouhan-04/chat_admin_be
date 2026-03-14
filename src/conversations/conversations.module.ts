import { Module } from '@nestjs/common';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './providers/conversations.service';
import {
  Conversation,
  ConversationSchema,
} from './entities/conversation.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { MessagesModule } from 'src/messages/messages.module';
import { CharactersModule } from 'src/characters/characters.module';
import { AI_STREAMER } from './ai/ai-streamer';
import { OpenRouterAiStreamerService } from './ai/openrouter-ai-streamer.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
    ]),
    MessagesModule,
    CharactersModule,
  ],
  controllers: [ConversationsController],
  providers: [
    ConversationsService,
    OpenRouterAiStreamerService,
    {
      provide: AI_STREAMER,
      useExisting: OpenRouterAiStreamerService,
    },
  ],
  exports: [MongooseModule],
})
export class ConversationsModule {}
