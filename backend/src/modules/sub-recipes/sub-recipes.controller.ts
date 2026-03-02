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
import { SubRecipesService } from './sub-recipes.service';
import { CreateSubRecipeDto, UpdateSubRecipeDto } from './dto/sub-recipe.dto';

@UseGuards(JwtAuthGuard)
@Controller('sub-recipes')
export class SubRecipesController {
  constructor(private readonly service: SubRecipesService) {}

  @Get()
  findAll(@Query('station_tag') stationTag?: string) {
    return this.service.findAll(stationTag);
  }

  @Get('station-tags')
  getStationTags() {
    return this.service.getStationTags();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSubRecipeDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSubRecipeDto,
  ) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(id);
  }
}
