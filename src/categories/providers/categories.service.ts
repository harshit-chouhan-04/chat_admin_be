import { Injectable } from '@nestjs/common';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Category } from '../entities/category.entity';
import { Model } from 'mongoose';
import { UpdateCategoryDto } from '../dtos/update-category.dto';

const PRESET_CATEGORY_NAMES = [
  'Bisexual',
  'Female',
  'Femboy',
  'Gay',
  'Male',
  'Trans',
  'BDSM',
  'DILF',
  'FemDom',
  'MILF',
  'Mature',
  'Alien',
  'Babysitter',
  'Bondage',
  'Casting',
  'Celebrity',
  'Cheating',
  'Cuckold',
  'Doctor',
  'Elf',
  'Exhibitionism',
  'Fantasy',
  'Feet',
  'Foot fetish',
  'Frotteurism',
  'Harassment',
  'Hentai',
  'Husband',
  'Lover',
  'Maid',
  'Massage',
  'Mistress',
  'Mystic',
  'Neighbour',
  'Nun',
  'Old',
  'Party',
  'Peeking',
  'Pegging',
  'Public sex',
  'Punishment',
  'Robber',
  'Sleeping',
  'Stepdaughter',
  'Stepmom',
  'Stepsister',
  'Stranger',
  'Student',
  'Teacher',
  'Tentacle',
  'Threesome',
  'Virgin',
  'Voyeurism',
  'Wife',
  'Young',
  'Dominant',
  'Drunk',
  'Naive',
  'Quite',
  'Rude',
  'Submissive',
  'African',
  'Arab',
  'Asian',
  'Indian',
  'Japanese',
  'Latina',
  'Latino',
  'Big ass',
  'Big cock',
  'Big tits',
  'Black hair',
  'Black skin',
  'Blonde',
  'Brunette',
  'Muscular',
  'Red hair',
  'Small tits',
  'Dormitory',
  'Nightclub',
  'School',
  'Swimming pool',
] as const;

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  createCategory(body: CreateCategoryDto) {
    const payload = {
      ...body,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    return this.categoryModel.create(payload);
  }
  getAllActiveCategories() {
    return this.categoryModel.find({ isActive: true, isDeleted: false });
  }
  getAllCategories() {
    return this.categoryModel.find({ isDeleted: false });
  }
  updateCategory(id: string, body: UpdateCategoryDto) {
    return this.categoryModel.findByIdAndUpdate(id, body, { new: true });
  }
  deleteCategory(id: string) {
    return this.categoryModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  async seedPresetCategories() {
    const operations = PRESET_CATEGORY_NAMES.map((name) => {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return {
        updateOne: {
          filter: { slug },
          update: {
            $setOnInsert: {
              name,
              slug,
              isNsfw: true,
              isActive: true,
              isDeleted: false,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await this.categoryModel.bulkWrite(operations, {
      ordered: false,
    });

    return {
      requested: PRESET_CATEGORY_NAMES.length,
      inserted: result.upsertedCount ?? 0,
      existing: PRESET_CATEGORY_NAMES.length - (result.upsertedCount ?? 0),
    };
  }
}
