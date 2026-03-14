import { Test, TestingModule } from '@nestjs/testing';
import { ConversationsService } from './conversations.service';
import { getModelToken } from '@nestjs/mongoose';
import { Conversation } from '../entities/conversation.entity';
import { Message } from 'src/messages/entities/message.entites';
import { Character } from 'src/characters/entities/character.entity';
import { AI_STREAMER } from '../ai/ai-streamer';

describe('ConversationsService', () => {
  let service: ConversationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConversationsService,
        { provide: getModelToken(Conversation.name), useValue: {} },
        { provide: getModelToken(Message.name), useValue: {} },
        { provide: getModelToken(Character.name), useValue: {} },
        {
          provide: AI_STREAMER,
          useValue: {
            streamText: async function* () {
              // no-op stream for unit test wiring
            },
          },
        },
      ],
    }).compile();

    service = module.get<ConversationsService>(ConversationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
