import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character } from 'src/characters/entities/character.entity';
import { Conversation } from 'src/conversations/entities/conversation.entity';
import { Invoice, InvoiceStatus } from 'src/invoices/entities/invoice.entity';
import { Message } from 'src/messages/entities/message.entity';
import { User } from 'src/users/entities/user.entity';
import { SENDER_TYPE } from 'src/common/enums/sender-type.enum';
import { DashboardMetricsQueryDto } from '../dtos/dashboard-metrics-query.dto';

type MetricSnapshot = {
  total: number;
  current: number;
  previous: number;
  changePct: number;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Character.name)
    private readonly characterModel: Model<Character>,
    @InjectModel(Conversation.name)
    private readonly conversationModel: Model<Conversation>,
    @InjectModel(Message.name) private readonly messageModel: Model<Message>,
    @InjectModel(Invoice.name) private readonly invoiceModel: Model<Invoice>,
  ) {}

  async getMetrics(query: DashboardMetricsQueryDto) {
    const { start, end, prevStart, prevEnd } = this.resolveDateRange(query);

    const [
      totalUsers,
      currentUsers,
      prevUsers,
      totalCharacters,
      currentCharacters,
      prevCharacters,
      totalConversations,
      currentConversations,
      prevConversations,
      totalMessages,
      currentMessages,
      prevMessages,
      totalRevenue,
      currentRevenue,
      prevRevenue,
    ] = await Promise.all([
      this.userModel.countDocuments({}),
      this.userModel.countDocuments({ createdAt: { $gte: start, $lt: end } }),
      this.userModel.countDocuments({
        createdAt: { $gte: prevStart, $lt: prevEnd },
      }),

      this.characterModel.countDocuments({ isDeleted: false }),
      this.characterModel.countDocuments({
        isDeleted: false,
        createdAt: { $gte: start, $lt: end },
      }),
      this.characterModel.countDocuments({
        isDeleted: false,
        createdAt: { $gte: prevStart, $lt: prevEnd },
      }),

      this.conversationModel.countDocuments({}),
      this.conversationModel.countDocuments({
        createdAt: { $gte: start, $lt: end },
      }),
      this.conversationModel.countDocuments({
        createdAt: { $gte: prevStart, $lt: prevEnd },
      }),

      this.messageModel.countDocuments({}),
      this.messageModel.countDocuments({
        createdAt: { $gte: start, $lt: end },
      }),
      this.messageModel.countDocuments({
        createdAt: { $gte: prevStart, $lt: prevEnd },
      }),

      this.sumRevenue({}),
      this.sumRevenue({ paidAt: { $gte: start, $lt: end } }),
      this.sumRevenue({ paidAt: { $gte: prevStart, $lt: prevEnd } }),
    ]);

    return {
      range: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        previousStartDate: prevStart.toISOString(),
        previousEndDate: prevEnd.toISOString(),
      },
      metrics: {
        totalUsers: this.snapshot(totalUsers, currentUsers, prevUsers),
        totalCharacters: this.snapshot(
          totalCharacters,
          currentCharacters,
          prevCharacters,
        ),
        totalConversations: this.snapshot(
          totalConversations,
          currentConversations,
          prevConversations,
        ),
        totalMessages: this.snapshot(
          totalMessages,
          currentMessages,
          prevMessages,
        ),
        revenue: this.snapshot(totalRevenue, currentRevenue, prevRevenue),
      },
    };
  }

  async getConversationsPerDay(query: DashboardMetricsQueryDto) {
    const { start, endExclusive, series } = this.resolveTimeseriesRange(query);

    const agg = await this.conversationModel.aggregate<{
      day: string;
      count: number;
    }>([
      { $match: { createdAt: { $gte: start, $lt: endExclusive } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          count: { $sum: 1 },
        },
      },
      { $project: { _id: 0, day: '$_id', count: 1 } },
      { $sort: { day: 1 } },
    ]);

    const countsByDay = new Map(
      agg.map((row) => [row.day, row.count] as const),
    );

    return series.map((d) => ({
      date: d.label,
      count: countsByDay.get(d.key) ?? 0,
    }));
  }

  async getMessageUsageOverTime(query: DashboardMetricsQueryDto) {
    const { start, endExclusive, series } = this.resolveTimeseriesRange(query);

    const agg = await this.messageModel.aggregate<{
      day: string;
      user: number;
      ai: number;
    }>([
      { $match: { createdAt: { $gte: start, $lt: endExclusive } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: 'UTC',
            },
          },
          user: {
            $sum: {
              $cond: [{ $eq: ['$senderType', SENDER_TYPE.USER] }, 1, 0],
            },
          },
          ai: {
            $sum: {
              $cond: [
                {
                  $in: [
                    '$senderType',
                    [SENDER_TYPE.CHARACTER, SENDER_TYPE.SYSTEM],
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $project: { _id: 0, day: '$_id', user: 1, ai: 1 } },
      { $sort: { day: 1 } },
    ]);

    const countsByDay = new Map(
      agg.map((row) => [row.day, { user: row.user, ai: row.ai }] as const),
    );

    return series.map((d) => {
      const row = countsByDay.get(d.key);
      return {
        date: d.label,
        user: row?.user ?? 0,
        ai: row?.ai ?? 0,
      };
    });
  }

  private resolveDateRange(query: DashboardMetricsQueryDto) {
    const end = query.endDate ? new Date(query.endDate) : new Date();
    const start = query.startDate
      ? new Date(query.startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException('Invalid startDate or endDate');
    }
    if (start >= end) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const windowMs = end.getTime() - start.getTime();
    const prevEnd = new Date(start.getTime());
    const prevStart = new Date(start.getTime() - windowMs);

    return { start, end, prevStart, prevEnd };
  }

  private resolveTimeseriesRange(
    query: DashboardMetricsQueryDto,
    defaultDays = 15,
  ) {
    const endInput = query.endDate ? new Date(query.endDate) : new Date();
    if (Number.isNaN(endInput.getTime())) {
      throw new BadRequestException('Invalid endDate');
    }

    const endDay = this.startOfDayUtc(endInput);
    const endExclusive = this.isUtcMidnight(endInput)
      ? endInput
      : this.addDaysUtc(endDay, 1);

    const startInput = query.startDate ? new Date(query.startDate) : undefined;
    if (startInput && Number.isNaN(startInput.getTime())) {
      throw new BadRequestException('Invalid startDate');
    }

    const start = startInput
      ? this.startOfDayUtc(startInput)
      : this.addDaysUtc(endExclusive, -defaultDays);

    if (start >= endExclusive) {
      throw new BadRequestException('startDate must be before endDate');
    }

    const series = this.buildDailySeries(start, endExclusive);
    return { start, endExclusive, series };
  }

  private buildDailySeries(start: Date, endExclusive: Date) {
    const fmt = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    });

    const out: Array<{ date: Date; key: string; label: string }> = [];
    for (
      let d = new Date(start.getTime());
      d < endExclusive;
      d = this.addDaysUtc(d, 1)
    ) {
      out.push({
        date: d,
        key: this.dayKeyUtc(d),
        label: fmt.format(d),
      });
    }

    return out;
  }

  private dayKeyUtc(date: Date) {
    const yyyy = date.getUTCFullYear();
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(date.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private startOfDayUtc(date: Date) {
    return new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );
  }

  private addDaysUtc(date: Date, days: number) {
    return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
  }

  private isUtcMidnight(date: Date) {
    return (
      date.getUTCHours() === 0 &&
      date.getUTCMinutes() === 0 &&
      date.getUTCSeconds() === 0 &&
      date.getUTCMilliseconds() === 0
    );
  }

  private snapshot(
    total: number,
    current: number,
    previous: number,
  ): MetricSnapshot {
    return {
      total,
      current,
      previous,
      changePct: this.percentChange(current, previous),
    };
  }

  private percentChange(current: number, previous: number): number {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }

    return this.round2(((current - previous) / previous) * 100);
  }

  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  private async sumRevenue(
    extraMatch: Record<string, unknown>,
  ): Promise<number> {
    const match: Record<string, unknown> = {
      status: InvoiceStatus.PAID,
      ...extraMatch,
    };

    const agg = await this.invoiceModel.aggregate<{ total: number }>([
      { $match: match },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return agg[0]?.total ?? 0;
  }
}
