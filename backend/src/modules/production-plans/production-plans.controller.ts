import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProductionPlansService } from './production-plans.service';
import { CreateProductionPlanDto, UpdateProductionPlanDto } from './dto/production-plan.dto';

@UseGuards(JwtAuthGuard)
@Controller('production-plans')
export class ProductionPlansController {
  constructor(private readonly service: ProductionPlansService) {}

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

  @Get(':id/sub-recipe-report')
  getSubRecipeReport(@Param('id') id: string) {
    return this.service.getSubRecipeReport(id);
  }

  @Get(':id/shopping-list')
  getShoppingList(@Param('id') id: string) {
    return this.service.getShoppingList(id);
  }
}
