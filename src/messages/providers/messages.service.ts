import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Message } from '../entities/message.entites';
import { SENDER_TYPE } from 'src/common/enums/sender-type.enum';
import { Conversation } from 'src/conversations/entities/conversation.entity';
import { User } from 'src/users/entities/user.entity';
import {
  computeUserMessageProgress,
  determineIntimacyStage,
} from 'src/conversations/providers/intimacy-progress.util';
import {
  calculateUserMessageCost,
  formatCostForDisplay,
} from './message-cost.util';

const MAX_MEMORY_LINES = 20;
const MAX_MEMORY_CHARS = 1800;

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private model: Model<Message>,
    @InjectModel(Conversation.name)
    private conversationModel: Model<Conversation>,
    @InjectModel(User.name)
    private userModel: Model<User>,
  ) {}

  async createUserMessage({
    chatId,
    content,
    sceneDetails,
  }: {
    chatId: string;
    content: string;
    sceneDetails?: string;
  }) {
    const conversation = await this.getConversationOrThrow(chatId);

    const ownerUserId =
      (conversation as any).user?.toString?.() ?? (conversation as any).user;

    if (!ownerUserId) {
      throw new NotFoundException('Conversation owner not found');
    }

    const owner = await this.userModel.findById(ownerUserId).select({
      _id: 1,
      numberOfMessageLeft: 1,
    });
    if (!owner) {
      throw new NotFoundException('User not found');
    }

    if (typeof owner.numberOfMessageLeft !== 'number') {
      await this.userModel.findByIdAndUpdate(owner._id, {
        $set: { numberOfMessageLeft: 5 },
      });
    }

    const decrementedOwner = await this.userModel.findOneAndUpdate(
      { _id: owner._id, numberOfMessageLeft: { $gt: 0 } },
      { $inc: { numberOfMessageLeft: -1 } },
      { new: true },
    );

    if (!decrementedOwner) {
      throw new HttpException(
        {
          code: 'MESSAGE_LIMIT_REACHED',
          message:
            'Free messages exhausted. Please purchase a message pack to continue.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    const currentScore = conversation?.intimacyScore ?? 0;
    const currentUserMessageCount = conversation?.userMessageCount ?? 0;
    const currentStage = determineIntimacyStage(
      currentScore,
      currentUserMessageCount,
    );
    const { tokenCount, cost } = calculateUserMessageCost(content);

    const progression = computeUserMessageProgress({
      currentScore,
      currentUserMessageCount,
      content,
      sceneDetails,
    });
    const updatedMemorySummary = this.buildUpdatedMemorySummary(
      conversation.memorySummary,
      content,
      sceneDetails,
    );

    const message = await this.model.create({
      conversation: chatId,
      senderType: SENDER_TYPE.USER,
      content,
      sceneDetails: sceneDetails?.trim() || undefined,
      tokenCount,
      cost,
      costDisplay: formatCostForDisplay(cost),
      isFlagged: false,
    });

    await this.conversationModel.findByIdAndUpdate(chatId, {
      $set: {
        lastMessageAt: new Date(),
        intimacyScore: progression.newScore,
        intimacyStage: progression.newStage,
        ...(progression.newStage !== currentStage
          ? { lastStageChangedAt: new Date() }
          : {}),
        memorySummary: updatedMemorySummary,
        memoryUpdatedAt: updatedMemorySummary
          ? new Date()
          : conversation.memoryUpdatedAt,
      },
      $inc: {
        messageCount: 1,
        userMessageCount: 1,
        totalTokenCount: tokenCount,
        totalCost: cost,
        userMessageCostTotal: cost,
      },
    });

    return {
      message,
      numberOfMessageLeft: decrementedOwner.numberOfMessageLeft ?? 0,
    };
  }

  async getByChat(chatId: string) {
    await this.getConversationOrThrow(chatId);
    return this.model.find({ conversation: chatId }).sort({ createdAt: 1 });
  }

  private async getConversationOrThrow(chatId: string): Promise<Conversation> {
    const conversation = await this.conversationModel.findById(chatId);
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  private buildUpdatedMemorySummary(
    existingMemory: string | undefined,
    content: string,
    sceneDetails?: string,
  ): string {
    const existingLines = (existingMemory ?? '')
      .split('\n')
      .map((line) => line.replace(/^\-\s*/, '').trim())
      .filter(Boolean);

    const candidates = this.extractMemoryCandidates(content, sceneDetails);
    if (candidates.length === 0) {
      return existingLines.length > 0
        ? existingLines.map((line) => `- ${line}`).join('\n')
        : '';
    }

    const merged = [...existingLines];
    for (const candidate of candidates) {
      const alreadyPresent = merged.some(
        (line) => line.toLowerCase() === candidate.toLowerCase(),
      );
      if (!alreadyPresent) {
        merged.push(candidate);
      }
    }

    const trimmed = merged.slice(-MAX_MEMORY_LINES);
    let summary = trimmed.map((line) => `- ${line}`).join('\n');
    if (summary.length <= MAX_MEMORY_CHARS) {
      return summary;
    }

    while (summary.length > MAX_MEMORY_CHARS && trimmed.length > 1) {
      trimmed.shift();
      summary = trimmed.map((line) => `- ${line}`).join('\n');
    }

    return summary.slice(0, MAX_MEMORY_CHARS).trim();
  }

  private extractMemoryCandidates(
    content: string,
    sceneDetails?: string,
  ): string[] {
    const normalizedContent = content.replace(/\s+/g, ' ').trim();
    if (!normalizedContent) {
      return [];
    }

    const sources = [normalizedContent];
    if (sceneDetails?.trim()) {
      sources.push(
        `Preferred scene: ${sceneDetails.replace(/\s+/g, ' ').trim()}`,
      );
    }

    const salientPattern =
      /\b(i am|i'm|my|mujhe|mujh|mera|meri|main|call me|you are|your|tum|aap|tumhari|tumhara|hair|baal|favourite|favorite|like|dislike|prefer|from|city|birthday|yaad|remember)\b/i;

    const fallbackNoisePattern =
      /^(hi|hey|hello|hii|ok|okay|hmm|hmmm|hmm+|lol|haan|han|h|k|kk|hii+|yo|sup)[.!?]*$/i;

    const extracted = sources
      .filter((line) => line.length >= 8 && salientPattern.test(line))
      .map((line) =>
        line.length > 160 ? `${line.slice(0, 157).trim()}...` : line,
      );

    if (extracted.length > 0) {
      return extracted;
    }

    if (
      normalizedContent.length >= 18 &&
      !fallbackNoisePattern.test(normalizedContent)
    ) {
      return [
        normalizedContent.length > 160
          ? `${normalizedContent.slice(0, 157).trim()}...`
          : normalizedContent,
      ];
    }

    return [];
  }
}
