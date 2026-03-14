import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Category,
  CategorySchema,
} from 'src/categories/entities/category.entity';
import { CharactersController } from './characters.controller';
import { CharactersService } from './providers/characters.service';
import { Character, CharacterSchema } from './entities/character.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService, MongooseModule],
})
export class CharactersModule {}
