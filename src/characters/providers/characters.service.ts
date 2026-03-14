import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  addObjectIdFilter,
  buildSort,
  createPaginatedResponse,
  escapeRegex,
  getPagination,
} from 'src/common/utils/query.util';
import { Category } from 'src/categories/entities/category.entity';
import { Character } from '../entities/character.entity';
import { CreateCharacterDto } from '../dtos/create-character.dto';
import { QueryCharactersDto } from '../dtos/query-characters.dto';
import { UpdateCharacterDto } from '../dtos/update-character.dto';

@Injectable()
export class CharactersService {
  constructor(
    @InjectModel(Character.name)
    private readonly characterModel: Model<Character>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
  ) {}

  async create(dto: CreateCharacterDto) {
    const slug = this.toSlug(dto.name);
    if (await this.characterModel.exists({ slug })) {
      throw new ConflictException('Character slug already exists');
    }

    if (dto.categories?.length) {
      const categoryCount = await this.categoryModel.countDocuments({
        _id: { $in: dto.categories },
        isDeleted: false,
      });
      if (categoryCount !== dto.categories.length) {
        throw new NotFoundException('One or more categories were not found');
      }
    }

    const character = await this.characterModel.create({
      ...dto,
      slug,
      categories: dto.categories ?? [],
      visibility: dto.visibility ?? 'public',
      isNsfw: dto.isNsfw ?? false,
      isActive: dto.isActive ?? true,
    });

    return this.findOne(String(character._id));
  }

  async findAll(query: QueryCharactersDto) {
    const filter: Record<string, unknown> = { isDeleted: false };

    if (query.search?.trim()) {
      filter.name = new RegExp(escapeRegex(query.search.trim()), 'i');
    }
    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }
    if (query.isNsfw !== undefined) {
      filter.isNsfw = query.isNsfw;
    }
    addObjectIdFilter(filter, 'categories', query.category);

    const { skip, limit } = getPagination(query);
    const [data, total] = await Promise.all([
      this.characterModel
        .find(filter)
        .populate('creator', 'name email username avatarUrl')
        .populate('categories', 'name slug isNsfw isActive')
        .sort(buildSort(query.sort, query.order))
        .skip(skip)
        .limit(limit)
        .lean(),
      this.characterModel.countDocuments(filter),
    ]);

    return createPaginatedResponse(data, total, query);
  }

  async findOne(id: string) {
    const character = await this.characterModel
      .findOne({ _id: id, isDeleted: false })
      .populate('creator', 'name email username avatarUrl')
      .populate('categories', 'name slug isNsfw isActive')
      .lean();

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  async update(id: string, dto: UpdateCharacterDto) {
    const updatePayload: Record<string, unknown> = { ...dto };
    if (dto.name) {
      updatePayload.slug = this.toSlug(dto.name);
    }

    const character = await this.characterModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      updatePayload,
      { new: true },
    );

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return this.findOne(String(character._id));
  }

  async remove(id: string) {
    const character = await this.characterModel
      .findOneAndUpdate(
        { _id: id, isDeleted: false },
        { isDeleted: true },
        {
          new: true,
        },
      )
      .lean();

    if (!character) {
      throw new NotFoundException('Character not found');
    }

    return character;
  }

  private toSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
