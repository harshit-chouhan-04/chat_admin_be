import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CharactersService } from './providers/characters.service';
import { Public } from 'src/common/guards/no-auth.guard';
import { CreateCharacterDto } from './dtos/create-character.dto';
import { UpdateCharacterDto } from './dtos/update-character.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Character } from './entities/character.entity';

@ApiTags('Characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all public characters' })
  @ApiOkResponse({ type: [Character] })
  getAllPublicCharacters() {
    return this.charactersService.getAllPublicCharacters();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all characters (including private/inactive)' })
  @ApiOkResponse({ type: [Character] })
  getAllCharacters() {
    return this.charactersService.getAllCharacters();
  }

  @Post()
  @ApiOperation({ summary: 'Create character' })
  @ApiCreatedResponse({ type: Character })
  createCharacter(@Body() body: CreateCharacterDto) {
    return this.charactersService.createCharacter(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update character by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Character })
  updateCharacter(@Body() body: UpdateCharacterDto, @Param('id') id: string) {
    return this.charactersService.updateCharacter(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete character by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Character })
  deleteCharacter(@Param('id') id: string) {
    return this.charactersService.deleteCharacter(id);
  }

  @Post('seed/preset')
  @ApiOperation({
    summary: 'Seed preset characters with multi-category assignment',
  })
  @ApiOkResponse({
    schema: {
      example: {
        requested: 6,
        inserted: 6,
        existing: 0,
      },
    },
  })
  seedPresetCharacters() {
    return this.charactersService.seedPresetCharacters();
  }
}
