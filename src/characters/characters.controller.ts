import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CharactersService } from './providers/characters.service';
import { CreateCharacterDto } from './dtos/create-character.dto';
import { QueryCharactersDto } from './dtos/query-characters.dto';
import { UpdateCharacterDto } from './dtos/update-character.dto';

@ApiTags('Characters')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Get()
  @ApiOperation({
    summary: 'List characters with pagination, search, and filters',
  })
  findAll(@Query() query: QueryCharactersDto) {
    return this.charactersService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a character' })
  create(@Body() dto: CreateCharacterDto) {
    return this.charactersService.create(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a character by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.charactersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a character' })
  @ApiParam({ name: 'id', type: String })
  update(@Param('id') id: string, @Body() dto: UpdateCharacterDto) {
    return this.charactersService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a character' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.charactersService.remove(id);
  }
}
