import { Module } from '@nestjs/common';
import { CharactersController } from './characters.controller';
import { CharactersService } from './providers/characters.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Character, CharacterSchema } from './entities/character.entity';
import { Category, CategorySchema } from 'src/categories/entities/category.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
      { name: Category.name, schema: CategorySchema },
    ]),
  ],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [MongooseModule],
})
export class CharactersModule {}
