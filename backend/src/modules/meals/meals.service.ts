import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMealDto, UpdateMealDto } from './dto/meal.dto';

@Injectable()
export class MealsService {
  constructor(private prisma: PrismaService) {}

  private includeSubRecipes = {
    subRecipes: {
      include: {
        subRecipe: {
          include: {
            ingredients: {
              include: {
                ingredient: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    },
    _count: { select: { subRecipes: true } },
  };

  async findAll(params: { search?: string; category?: string; skip?: number; take?: number }) {
    const { search, category, skip = 0, take = 200 } = params;
    const where: any = {};
    if (search) where.name = { contains: search, mode: 'insensitive' };
    if (category) where.category = category;

    const [data, total] = await Promise.all([
      this.prisma.meal.findMany({
        where,
        include: this.includeSubRecipes,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.meal.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const meal = await this.prisma.meal.findUnique({
      where: { id },
      include: this.includeSubRecipes,
    });
    if (!meal) throw new NotFoundException('Meal not found');
    return meal;
  }

  async create(dto: CreateMealDto) {
    const { subRecipes, ...rest } = dto;
    return this.prisma.meal.create({
      data: {
        ...rest,
        subRecipes: subRecipes
          ? {
              create: subRecipes.map((sr) => ({
                subRecipeId: sr.subRecipeId,
                srName: sr.srName,
                perPortion: sr.perPortion,
                unit: sr.unit,
              })),
            }
          : undefined,
      },
      include: this.includeSubRecipes,
    });
  }

  async update(id: string, dto: UpdateMealDto) {
    await this.findOne(id);
    const { subRecipes, id: _id, ...rest } = dto;
    return this.prisma.meal.update({
      where: { id },
      data: {
        ...rest,
        ...(subRecipes
          ? {
              subRecipes: {
                deleteMany: {},
                create: subRecipes.map((sr) => ({
                  subRecipeId: sr.subRecipeId,
                  srName: sr.srName,
                  perPortion: sr.perPortion,
                  unit: sr.unit,
                })),
              },
            }
          : {}),
      },
      include: this.includeSubRecipes,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.meal.delete({ where: { id } });
    return { success: true };
  }

  async getCategories() {
    const result = await this.prisma.meal.groupBy({
      by: ['category'],
      where: { category: { not: null } },
      orderBy: { category: 'asc' },
    });
    return result.map((r) => r.category).filter(Boolean);
  }
}
