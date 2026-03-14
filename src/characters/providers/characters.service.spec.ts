import { Test, TestingModule } from '@nestjs/testing';
import { CharactersService } from './characters.service';
import { getModelToken } from '@nestjs/mongoose';
import { Character } from '../entities/character.entity';

describe('CharactersService', () => {
  let service: CharactersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CharactersService,
        { provide: getModelToken(Character.name), useValue: {} },
      ],
    }).compile();

    service = module.get<CharactersService>(CharactersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
