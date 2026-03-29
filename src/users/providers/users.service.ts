import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  createPaginatedResponse,
  buildSort,
  escapeRegex,
  getPagination,
} from 'src/common/utils/query.util';
import { Invoice } from 'src/invoices/entities/invoice.entity';
import { Message } from 'src/messages/entities/message.entity';
import { Plan } from 'src/plans/entities/plan.entity';
import { User } from '../entities/user.entity';
import { Conversation } from 'src/conversations/entities/conversation.entity';
import { QueryUsersDto } from '../dtos/query-users.dto';
import {
  InvoiceStatus,
  PaymentProvider,
} from 'src/invoices/entities/invoice.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
    @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
  ) {}

  private formatInvoiceIdFromMongoId(mongoId: unknown, date: Date) {
    const idStr = String(mongoId);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    // Take the last 4 hex chars from ObjectId, convert to a number,
    // then keep the last 4 decimal digits (always numeric).
    const tailHex = idStr.slice(-4);
    const tailNum = Number.parseInt(tailHex, 16);
    const suffix = String(Number.isNaN(tailNum) ? 0 : tailNum)
      .slice(-4)
      .padStart(4, '0');

    return `DP-${yyyy}${mm}${dd}-${suffix}`;
  }

  async create(data: {
    name?: string;
    email: string;
    username?: string;
    passwordHash?: string;
    avatarUrl?: string;
  }) {
    const baseUsername = (
      data.username ||
      data.name?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
      data.email.split('@')[0]
    ).trim();

    let username = baseUsername;
    let counter = 1;

    while (await this.userModel.exists({ username })) {
      username = `${baseUsername}${counter}`;
      counter += 1;
    }

    const created = await this.userModel.create({
      ...data,
      email: data.email.toLowerCase(),
      username,
      numberOfMessageLeft: 5,
    });

    return created.toObject();
  }

  async findAll(query: QueryUsersDto) {
    const filter: Record<string, unknown> = {};

    if (query.search?.trim()) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { username: regex }];
    }

    const { skip, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .sort(buildSort(query.sort, query.order))
        .skip(skip)
        .limit(limit)
        .lean(),
      this.userModel.countDocuments(filter),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email: email.toLowerCase() }).lean();
  }

  findByEmailForAuth(email: string) {
    return this.userModel
      .findOne({ email: email.toLowerCase() })
      .select('+passwordHash');
  }

  async findOne(id: string) {
    const user = await this.userModel.findById(id).lean();
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [conversationsCount, invoicesCount, totalSpentAgg] =
      await Promise.all([
        this.conversationModel.countDocuments({ user: id }),
        this.invoiceModel.countDocuments({ user: id }),
        this.invoiceModel.aggregate<{ total: number }>([
          { $match: { user: user._id, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
      ]);

    const conversationIds = await this.conversationModel.distinct('_id', {
      user: id,
    });
    const messagesCount = await this.messageModel.countDocuments({
      conversation: { $in: conversationIds as any[] },
    });

    return {
      ...user,
      stats: {
        conversationsCount,
        messagesCount,
        invoicesCount,
        totalSpent: totalSpentAgg[0]?.total ?? 0,
      },
    };
  }

  async updateNumberOfMessageLeft(
    id: string,
    numberOfMessageLeft: number,
    planId?: string,
  ) {
    if (!planId) {
      throw new BadRequestException('Plan ID is required');
    }
    const plan = await this.planModel.findById(planId).lean();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }
    const user = await this.userModel
      .findByIdAndUpdate(
        id,
        {
          $inc: {
            numberOfMessageLeft: plan.messageLimit,
            credits: plan.credits,
          },
        },
        { new: true },
      )
      .lean();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const paidAt = new Date();

    // invoiceId must include digits derived from the Mongo _id, so we create first,
    // then update invoiceId once _id exists.
    const created = await this.invoiceModel.create({
      invoiceId: `TMP_${Date.now()}_${randomUUID().replace(/-/g, '')}`,
      user: user._id,
      plan: plan._id,
      amount: plan.price,
      numberOfMessages: plan.messageLimit,
      credits: plan.credits,
      currency: 'INR',
      status: InvoiceStatus.PAID,
      paymentProvider: PaymentProvider.OTHER,
      paidAt,
    });

    const finalInvoiceId = this.formatInvoiceIdFromMongoId(created._id, paidAt);
    await this.invoiceModel.updateOne(
      { _id: created._id },
      { $set: { invoiceId: finalInvoiceId } },
    );

    return user;
  }

  updateById(id: string, data: Partial<User>) {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).lean();
  }
}
