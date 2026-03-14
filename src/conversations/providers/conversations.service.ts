import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  buildSort,
  createPaginatedResponse,
  getPagination,
} from 'src/common/utils/query.util';
import { Character } from 'src/characters/entities/character.entity';
import { Message } from 'src/messages/entities/message.entity';

import { Conversation } from '../entities/conversation.entity';
import { QueryConversationsDto } from '../dtos/query-conversations.dto';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(Message.name)
    private readonly messageModel: Model<Message>,
    @InjectModel(Character.name)
    private readonly characterModel: Model<Character>,
  ) {}

  async findAll(query: QueryConversationsDto) {
    const filter: Record<string, unknown> = {};
    if (query.user) {
      filter.user = query.user as any;
    }
    if (query.character) {
      filter.character = query.character as any;
    }
    if (query.isArchived !== undefined) {
      filter.isArchived = query.isArchived;
    }

    const { skip, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.conversationModel
        .find(filter)
        .populate('user', 'name email username avatarUrl')
        .populate({
          path: 'character',
          populate: { path: 'categories', select: 'name slug isNsfw isActive' },
        })
        .sort(buildSort(query.sort, query.order))
        .skip(skip)
        .limit(limit)
        .lean(),
      this.conversationModel.countDocuments(filter),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    const conversation = await this.conversationModel
      .findById(id)
      .populate('user', 'name email username avatarUrl')
      .populate({
        path: 'character',
        populate: { path: 'categories', select: 'name slug isNsfw isActive' },
      })
      .lean();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async getMessages(conversationId: string) {
    await this.getConversationOrThrow(conversationId);
    return this.messageModel
      .find({ conversation: conversationId })
      .sort({ createdAt: 1 })
      .lean();
  }

  private async getConversationOrThrow(
    conversationId: string,
  ): Promise<Conversation> {
    const conversation = await this.conversationModel.findById(conversationId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
