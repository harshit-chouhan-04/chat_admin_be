import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  buildSort,
  createPaginatedResponse,
  escapeRegex,
  getPagination,
} from 'src/common/utils/query.util';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { QueryCategoriesDto } from '../dtos/query-categories.dto';
import { UpdateCategoryDto } from '../dtos/update-category.dto';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async create(dto: CreateCategoryDto) {
    const slug = this.toSlug(dto.name);
    const exists = await this.categoryModel.exists({
      $or: [{ name: dto.name }, { slug }],
    });

    if (exists) {
      throw new ConflictException('Category already exists');
    }

    const category = await this.categoryModel.create({
      ...dto,
      slug,
      isActive: dto.isActive ?? true,
      isNsfw: dto.isNsfw ?? false,
    });

    return category.toObject();
  }

  async findAll(query: QueryCategoriesDto) {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.search?.trim()) {
      const regex = new RegExp(escapeRegex(query.search.trim()), 'i');
      filter.$or = [{ name: regex }, { slug: regex }];
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query.isNsfw !== undefined) {
      filter.isNsfw = query.isNsfw;
    }

    const { skip, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .sort(buildSort(query.sort, query.order))
        .skip(skip)
        .limit(limit)
        .lean(),
      this.categoryModel.countDocuments(filter),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    const category = await this.categoryModel
      .findOne({ _id: id, isDeleted: false })
      .lean();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const updatePayload: Record<string, unknown> = { ...dto };
    if (dto.name) {
      updatePayload.slug = this.toSlug(dto.name);
    }

    const category = await this.categoryModel
      .findOneAndUpdate({ _id: id, isDeleted: false }, updatePayload, {
        new: true,
      })
      .lean();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async remove(id: string) {
    const category = await this.categoryModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        {
          new: true,
        },
      )
      .lean();

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  private toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
