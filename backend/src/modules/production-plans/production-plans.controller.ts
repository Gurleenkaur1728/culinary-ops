import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ProductionPlansService } from './production-plans.service';
import { CreateProductionPlanDto, UpdateProductionPlanDto, UpsertPlanItemDto } from './dto/production-plan.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('production-plans')
export class ProductionPlansController {
  constructor(private service: ProductionPlansService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateProductionPlanDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProductionPlanDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string) {
    return this.service.duplicate(id);
  }

  @Post(':id/items')
  upsertItem(@Param('id') planId: string, @Body() dto: UpsertPlanItemDto) {
    return this.service.upsertItem(planId, dto);
  }

  @Delete(':id/items/:mealId')
  removeItem(@Param('id') planId: string, @Param('mealId') mealId: string) {
    return this.service.removeItem(planId, mealId);
  }
}
