import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubRecipeDto, UpdateSubRecipeDto } from './dto/sub-recipe.dto';

@Injectable()
export class SubRecipesService {
  constructor(private prisma: PrismaService) {}

  private includeIngredients = {
    ingredients: {
      include: {
        ingredient: { select: { id: true, name: true } },
      },
    },
  };

  async findAll(params: {
    search?: string;
    station?: string;
    day?: string;
    priority?: string;
    skip?: number;
    take?: number;
  }) {
    const { search, station, day, priority, skip = 0, take = 50 } = params;
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (station) where.station = { contains: station, mode: 'insensitive' };
    if (day) where.day = day;
    if (priority) where.priority = Number(priority);

    const [data, total] = await Promise.all([
      this.prisma.subRecipe.findMany({
        where,
        include: this.includeIngredients,
        orderBy: [{ station: 'asc' }, { priority: 'asc' }, { name: 'asc' }],
        skip,
        take,
      }),
      this.prisma.subRecipe.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const sr = await this.prisma.subRecipe.findUnique({
      where: { id },
      include: this.includeIngredients,
    });
    if (!sr) throw new NotFoundException('Sub-recipe not found');
    return sr;
  }

  async create(dto: CreateSubRecipeDto) {
    const { ingredients, ...rest } = dto;
    return this.prisma.subRecipe.create({
      data: {
        ...rest,
        ingredients: ingredients
          ? {
              create: ingredients.map((i) => ({
                ingredientId: i.ingredientId,
                weight: i.weight,
                unit: i.unit,
                trimPct: i.trimPct,
              })),
            }
          : undefined,
      },
      include: this.includeIngredients,
    });
  }

  async update(id: string, dto: UpdateSubRecipeDto) {
    await this.findOne(id);
    const { ingredients, id: _id, ...rest } = dto;
    return this.prisma.subRecipe.update({
      where: { id },
      data: {
        ...rest,
        ...(ingredients
          ? {
              ingredients: {
                deleteMany: {},
                create: ingredients.map((i) => ({
                  ingredientId: i.ingredientId,
                  weight: i.weight,
                  unit: i.unit,
                  trimPct: i.trimPct,
                })),
              },
            }
          : {}),
      },
      include: this.includeIngredients,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.subRecipe.delete({ where: { id } });
    return { success: true };
  }
}
