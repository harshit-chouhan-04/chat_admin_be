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
import { CreatePlanDto } from './dtos/create-plan.dto';
import { QueryPlansDto } from './dtos/query-plans.dto';
import { UpdatePlanDto } from './dtos/update-plan.dto';
import { PlansService } from './providers/plans.service';
import { Public } from 'src/common/guards/no-auth.guard';

@ApiTags('Plans')
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @ApiOperation({ summary: 'List plans with pagination and filters' })
  findAll(@Query() query: QueryPlansDto) {
    return this.plansService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a plan' })
  create(@Body() dto: CreatePlanDto) {
    return this.plansService.create(dto);
  }
  @Public()
  @Post('seed')
  @ApiOperation({ summary: 'Seed 3 default plans (idempotent)' })
  seedDefaults() {
    return this.plansService.seedDefaults();
    // return this.plansService.setPlanTypeToNormalForExistingPlans();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a plan by id' })
  @ApiParam({ name: 'id', type: String })
  findOne(@Param('id') id: string) {
    return this.plansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a plan' })
  @ApiParam({ name: 'id', type: String })
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plansService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a plan' })
  @ApiParam({ name: 'id', type: String })
  remove(@Param('id') id: string) {
    return this.plansService.remove(id);
  }
}
