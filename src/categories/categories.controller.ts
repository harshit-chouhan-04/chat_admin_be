import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoriesService } from './providers/categories.service';
import { Public } from 'src/common/guards/no-auth.guard';
import { CreateCategoryDto } from './dtos/create-category.dto';
import { UpdateCategoryDto } from './dtos/update-category.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Category } from './entities/category.entity';

@ApiTags('Categories')
@Controller('category')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all active categories' })
  @ApiOkResponse({ type: [Category] })
  getAllActiveCategories() {
    return this.categoriesService.getAllActiveCategories();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all categories (including inactive)' })
  @ApiOkResponse({ type: [Category] })
  getAllCategories() {
    return this.categoriesService.getAllCategories();
  }

  @Post()
  @ApiOperation({ summary: 'Create category' })
  @ApiCreatedResponse({ type: Category })
  createCategory(@Body() body: CreateCategoryDto) {
    return this.categoriesService.createCategory(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Category })
  updateCategory(@Body() body: UpdateCategoryDto, @Param('id') id: string) {
    return this.categoriesService.updateCategory(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ type: Category })
  deleteCategory(@Param('id') id: string) {
    return this.categoriesService.deleteCategory(id);
  }

  @Post('seed/preset')
  @ApiOperation({
    summary: 'Seed preset categories from product taxonomy',
  })
  @ApiOkResponse({
    schema: {
      example: {
        requested: 84,
        inserted: 84,
        existing: 0,
      },
    },
  })
  seedPresetCategories() {
    return this.categoriesService.seedPresetCategories();
  }
}
