import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MealsService } from './meals.service';
import { CreateMealDto, UpdateMealDto } from './dto/meal.dto';

@UseGuards(JwtAuthGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly service: MealsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.service.findAll();
  }

  @Get('categories')
  getCategories() {
    return this.service.getCategories();
  }

  @Get('pricing')
  getPricing() {
    return this.service.getPricing();
  }

  @Get('cooking-sheet')
  getCookingSheet(@Query('category') category?: string) {
    return this.service.getCookingSheet(category);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateMealDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateMealDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
