import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { SubRecipesService } from './sub-recipes.service';
import { CreateSubRecipeDto, UpdateSubRecipeDto } from './dto/sub-recipe.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('sub-recipes')
export class SubRecipesController {
  constructor(private service: SubRecipesService) {}

  @Get()
  findAll(
    @Query('search') search?: string,
    @Query('station') station?: string,
    @Query('day') day?: string,
    @Query('priority') priority?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.service.findAll({
      search,
      station,
      day,
      priority,
      skip: Number(skip) || 0,
      take: Number(take) || 50,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSubRecipeDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSubRecipeDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
