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
import { BillingCycle, Plan, PlanType } from '../entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
  ) {}
  setPlanTypeToNormalForExistingPlans() {
    return this.planModel.updateMany(
      { isPopular: { $exists: false } },
      { $set: { isPopular: false } },
    );
  }

  async seedDefaults() {
    const defaults: Array<{
      _id: string;
      name: string;
      price: number;
      billingCycle: BillingCycle;
      type: PlanType;
      credits: number;
      messageLimit: number;
      description: string;
      isActive: boolean;
      isDeleted: boolean;
      isPopular: boolean;
    }> = [
      {
        _id: '69c966301255554ffb1c5091',
        name: 'Baatein Shuru',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 39,
        messageLimit: 100,
        credits: 0,
        description: '100 message top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5092',
        name: 'Dil Ki Baatein',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 149,
        messageLimit: 500,
        credits: 0,
        description: '500 message top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5093',
        name: 'Raat Bhar Baatein',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 499,
        messageLimit: 2000,
        credits: 0,
        description: '2000 message top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5094',
        name: 'NonStop Baatein',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 999,
        messageLimit: 5000,
        credits: 0,
        description: '5000 message top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5095',
        name: 'Jhalak',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 59,
        messageLimit: 0,
        credits: 10,
        description: '10 image top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5096',
        name: 'Nazara',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 129,
        messageLimit: 0,
        credits: 25,
        description: '25 image top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5097',
        name: 'Deewangi',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 399,
        messageLimit: 0,
        credits: 100,
        description: '100 image top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5098',
        name: 'Beintehaa',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 999,
        messageLimit: 0,
        credits: 300,
        description: '300 image top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69c966301255554ffb1c5099',
        name: 'Beintehaa Max',
        type: PlanType.TOP_UP,
        billingCycle: BillingCycle.ONE_TIME,
        price: 2999,
        messageLimit: 0,
        credits: 1000,
        description: '1000 image top-up',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69b66ac618eab82f457479ab',
        name: 'Shuruaat',
        price: 99,
        billingCycle: BillingCycle.ONE_TIME,
        type: PlanType.NORMAl,
        credits: 10,
        messageLimit: 120,
        description: 'Shuruaat one-time plan',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
      {
        _id: '69b66ac618eab82f457479ac',
        name: 'Masti',
        price: 299,
        billingCycle: BillingCycle.ONE_TIME,
        type: PlanType.NORMAl,
        credits: 30,
        messageLimit: 420,
        description: 'Masti one-time plan',
        isActive: true,
        isDeleted: false,
        isPopular: true,
      },
      {
        _id: '69b66ac618eab82f457479ad',
        name: 'Beintehaa',
        price: 699,
        billingCycle: BillingCycle.ONE_TIME,
        type: PlanType.NORMAl,
        credits: 60,
        messageLimit: 1000,
        description: 'Beintehaa one-time plan',
        isActive: true,
        isDeleted: false,
        isPopular: false,
      },
    ];
    // [
    //   {
    //     name: 'Baatein Shuru',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 39,
    //     messageLimit: 100,
    //     credits: 0,
    //     description: '100 message top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Dil Ki Baatein',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 149,
    //     messageLimit: 500,
    //     credits: 0,
    //     description: '500 message top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Raat Bhar Baatein',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 499,
    //     messageLimit: 2000,
    //     credits: 0,
    //     description: '2000 message top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'NonStop Baatein',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 999,
    //     messageLimit: 5000,
    //     credits: 0,
    //     description: '5000 message top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Jhalak',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 59,
    //     messageLimit: 0,
    //     credits: 10,
    //     description: '10 image top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Nazara',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 129,
    //     messageLimit: 0,
    //     credits: 25,
    //     description: '25 image top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Deewangi',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 399,
    //     messageLimit: 0,
    //     credits: 100,
    //     description: '100 image top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Beintehaa',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 999,
    //     messageLimit: 0,
    //     credits: 300,
    //     description: '300 image top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Beintehaa Max',
    //     type: PlanType.TOP_UP,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     price: 2999,
    //     messageLimit: 0,
    //     credits: 1000,
    //     description: '1000 image top-up',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Shuruaat',
    //     price: 99,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     type: PlanType.NORMAl,
    //     credits: 10,
    //     messageLimit: 120,
    //     description: 'Shuruaat one-time plan',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Masti',
    //     price: 299,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     type: PlanType.NORMAl,
    //     credits: 30,
    //     messageLimit: 420,
    //     description: 'Masti one-time plan',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    //   {
    //     name: 'Beintehaa',
    //     price: 699,
    //     billingCycle: BillingCycle.ONE_TIME,
    //     type: PlanType.NORMAl,
    //     credits: 60,
    //     messageLimit: 1000,
    //     description: 'Beintehaa one-time plan',
    //     isActive: true,
    //     isDeleted: false,
    //     isPopular: false,
    //   },
    // ];

    const names = defaults.map((p) => p.name);
    const before = await this.planModel.countDocuments({
      name: { $in: names },
    });

    await this.planModel.bulkWrite(
      defaults.map((plan) => ({
        updateOne: {
          filter: { _id: plan._id },
          update: { $set: plan },
          upsert: true,
        },
      })),
      { ordered: false },
    );

    const afterPlans = await this.planModel
      .find({ _id: { $in: defaults.map((p) => p._id) } })
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
