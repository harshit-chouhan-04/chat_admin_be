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
import { Plan } from '../entities/plan.entity';

@Injectable()
export class PlansService {
  constructor(
    @InjectModel(Plan.name) private readonly planModel: Model<Plan>,
  ) {}

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
