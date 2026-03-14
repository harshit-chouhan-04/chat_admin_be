import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Character } from '../entities/character.entity';
import { CreateCharacterDto } from '../dtos/create-character.dto';
import { UpdateCharacterDto } from '../dtos/update-character.dto';
import { CHARACTER_VISIBILITY } from 'src/common/enums/character-visibility.enum';
import { Category } from 'src/categories/entities/category.entity';

const PRESET_CHARACTERS = [
  {
    name: 'Riya',
    description: 'Sharmili but deeply romantic and curious.',
    personalityPrompt: 'You are Riya, shy, warm, romantic and emotionally attentive.',
    systemPrompt: 'Act as a virtual companion and stay in character as Riya.',
    categories: ['Female', 'Romantic', 'Indian', 'Brunette', 'Young'],
    avatarUrl: 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df',
  },
  {
    name: 'Aarav',
    description: 'Confident, dominant, and protective.',
    personalityPrompt: 'You are Aarav, confident, intense and protective.',
    systemPrompt: 'Roleplay as Aarav with assertive but respectful tone.',
    categories: ['Male', 'Dominant', 'Indian', 'Muscular', 'Mature'],
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
  },
  {
    name: 'Meera',
    description: 'Playful, teasing, and affectionate.',
    personalityPrompt: 'You are Meera, playful, witty, and flirty.',
    systemPrompt: 'Keep responses lively and emotionally engaging as Meera.',
    categories: ['Female', 'Playful', 'Fantasy', 'Latina', 'Young'],
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
  },
  {
    name: 'Vikram',
    description: 'Intense, mysterious, and bold.',
    personalityPrompt: 'You are Vikram, mysterious and intense with strong presence.',
    systemPrompt: 'Maintain a bold and charismatic style as Vikram.',
    categories: ['Male', 'Mysterious', 'Intense', 'Black hair', 'Mature'],
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d',
  },
  {
    name: 'Zara',
    description: 'Independent, fierce, and seductive.',
    personalityPrompt: 'You are Zara, confident, sharp, and seductive.',
    systemPrompt: 'Roleplay Zara with confidence and emotional nuance.',
    categories: ['Female', 'Bold', 'Mistress', 'Arab', 'Black hair'],
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
  },
  {
    name: 'Kabir',
    description: 'Poetic, slow-burn romantic with deep emotions.',
    personalityPrompt: 'You are Kabir, poetic, intimate, and thoughtful.',
    systemPrompt: 'Respond with soft emotional depth as Kabir.',
    categories: ['Male', 'Romantic', 'Submissive', 'Indian', 'Teacher'],
    avatarUrl: 'https://images.unsplash.com/photo-1506277886164-e25aa3f4ef7f',
  },
] as const;

@Injectable()
export class CharactersService {
  constructor(
    @InjectModel(Character.name) private characterModel: Model<Character>,
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  createCharacter(body: CreateCharacterDto) {
    const categories =
      body.categories?.length > 0
        ? body.categories
        : body.category
          ? [body.category]
          : [];

    const payload = {
      ...body,
      categories,
      slug: body.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    };
    return this.characterModel.create(payload);
  }

  getAllPublicCharacters() {
    return this.characterModel.find({
      visibility: CHARACTER_VISIBILITY.PUBLIC,
      isActive: true,
      isDeleted: false,
    });
  }

  getAllCharacters() {
    return this.characterModel.find({ isDeleted: false });
  }

  updateCharacter(id: string, body: UpdateCharacterDto) {
    return this.characterModel.findByIdAndUpdate(id, body, { new: true });
  }

  deleteCharacter(id: string) {
    return this.characterModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true },
    );
  }

  async seedPresetCharacters() {
    const categories = await this.categoryModel.find({
      isDeleted: false,
      isActive: true,
    });

    const categoryIdBySlug = new Map(
      categories.map((c) => [c.slug, c._id.toString()]),
    );

    const operations = PRESET_CHARACTERS.map((char) => {
      const categoryIds = char.categories
        .map((name) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        .map((slug) => categoryIdBySlug.get(slug))
        .filter((id): id is string => Boolean(id));

      const slug = char.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      return {
        updateOne: {
          filter: { slug },
          update: {
            $setOnInsert: {
              creator: 'system-seed',
              name: char.name,
              slug,
              description: char.description,
              personalityPrompt: char.personalityPrompt,
              systemPrompt: char.systemPrompt,
              categories: categoryIds,
              visibility: CHARACTER_VISIBILITY.PUBLIC,
              isNsfw: true,
              avatarUrl: char.avatarUrl,
              voiceModel: 'alloy',
              isActive: true,
              isDeleted: false,
            },
          },
          upsert: true,
        },
      };
    });

    const result = await this.characterModel.bulkWrite(operations, {
      ordered: false,
    });

    return {
      requested: PRESET_CHARACTERS.length,
      inserted: result.upsertedCount ?? 0,
      existing: PRESET_CHARACTERS.length - (result.upsertedCount ?? 0),
    };
  }
}
