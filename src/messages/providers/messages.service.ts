import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  buildSort,
  createPaginatedResponse,
  getPagination,
} from 'src/common/utils/query.util';
import { User } from 'src/users/entities/user.entity';
import { Message } from '../entities/message.entity';
import { Conversation } from 'src/conversations/entities/conversation.entity';
import { QueryMessagesDto } from '../dtos/query-messages.dto';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private readonly model: Model<Message>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findAll(query: QueryMessagesDto) {
    const filter: Record<string, unknown> = {};
    if (query.conversation) {
      filter.conversation = query.conversation as any;
    }
    if (query.senderType) {
      filter.senderType = query.senderType;
    }

    const { skip, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.model
        .find(filter)
        .populate({
          path: 'conversation',
          populate: [
            { path: 'user', select: 'name email username avatarUrl' },
            { path: 'character', select: 'name slug avatarUrl' },
          ],
        })
        .sort(buildSort(query.sort, query.order))
        .skip(skip)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    const message = await this.model
      .findById(id)
      .populate({
        path: 'conversation',
        populate: [
          { path: 'user', select: 'name email username avatarUrl' },
          { path: 'character', select: 'name slug avatarUrl' },
        ],
      })
      .lean();

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    return message;
  }

  async getByChat(chatId: string) {
    await this.getConversationOrThrow(chatId);
    return this.model
      .find({ conversation: chatId })
      .sort({ createdAt: 1 })
      .lean();
  }

  private async getConversationOrThrow(chatId: string): Promise<Conversation> {
    const conversation = await this.conversationModel.findById(chatId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }
}
