import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  buildSort,
  createPaginatedResponse,
  escapeRegex,
  getPagination,
} from 'src/common/utils/query.util';
import { CreatePlanDto } from '../dtos/create-plan.dto';
import { QueryPlansDto } from '../dtos/query-plans.dto';
import { UpdatePlanDto } from '../dtos/update-plan.dto';
import { BillingCycle, Plan } from '../entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
  ) {}

  async seedDefaults() {
    const defaults: Array<{
      name: string;
      price: number;
      billingCycle: BillingCycle;
      credits: number;
      messageLimit: number;
      description: string;
      isActive: boolean;
      isDeleted: boolean;
    }> = [
      {
        name: 'Basic',
        price: 99,
        billingCycle: BillingCycle.ONE_TIME,
        credits: 20,
        messageLimit: 120,
        description: 'Basic one-time plan',
        isActive: true,
        isDeleted: false,
      },
      {
        name: 'Pro',
        price: 299,
        billingCycle: BillingCycle.ONE_TIME,
        credits: 40,
        messageLimit: 420,
        description: 'Pro one-time plan',
        isActive: true,
        isDeleted: false,
      },
      {
        name: 'Plus',
        price: 699,
        billingCycle: BillingCycle.ONE_TIME,
        credits: 80,
        messageLimit: 1000,
        description: 'Plus one-time plan',
        isActive: true,
        isDeleted: false,
      },
    ];

    const names = defaults.map((p) => p.name);
    const before = await this.planModel.countDocuments({
      name: { $in: names },
    });

    await this.planModel.bulkWrite(
      defaults.map((plan) => ({
        updateOne: {
          filter: { name: plan.name },
          update: { $setOnInsert: plan },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    const afterPlans = await this.planModel
      .find({ name: { $in: names } })
      .sort({ price: 1 })
      .lean();

    const after = afterPlans.length;
    return {
      inserted: Math.max(0, after - before),
      existing: Math.max(0, before),
      plans: afterPlans,
    };
  }

  async create(dto: CreatePlanDto) {
    const plan = await this.planModel.create({
      ...dto,
      isActive: dto.isActive ?? true,
    });

    return plan.toObject();
  }

  async findAll(query: QueryPlansDto) {
    const filter: Record<string, unknown> = {};
    if (query.search?.trim()) {
      filter.name = new RegExp(escapeRegex(query.search.trim()), 'i');
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    const { skip, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.planModel
        .find(filter)
        .sort(buildSort(query.sort, query.order))
        .skip(skip)
        .limit(limit)
        .lean(),
      this.planModel.countDocuments(filter),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    const plan = await this.planModel.findById(id).lean();
    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async update(id: string, dto: UpdatePlanDto) {
    const plan = await this.planModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  async remove(id: string) {
    const plan = await this.planModel.findByIdAndDelete(id).lean();

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }
}
