import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CostEngineService } from '../../services/cost-engine.service';
import { CreateMealDto, UpdateMealDto } from './dto/meal.dto';

@Injectable()
export class MealsService {
  constructor(
    private prisma: PrismaService,
    private costEngine: CostEngineService,
  ) {}

  async findAll() {
    return this.prisma.mealRecipe.findMany({
      include: {
        components: {
          include: {
            ingredient: { select: { id: true, internal_name: true, sku: true } },
            sub_recipe: { select: { id: true, name: true, sub_recipe_code: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const meal = await this.prisma.mealRecipe.findUnique({
      where: { id },
      include: {
        components: {
          include: {
            ingredient: true,
            sub_recipe: {
              include: {
                components: {
                  include: { ingredient: true },
                },
              },
            },
          },
        },
        orders: {
          orderBy: { production_date: 'desc' },
          take: 10,
        },
      },
    });
    if (!meal) throw new NotFoundException('Meal not found');
    return meal;
  }

  async create(dto: CreateMealDto) {
    this.validateComponents(dto.components ?? []);

    const { components, ...mealData } = dto;

    const meal = await this.prisma.$transaction(async (tx) => {
      const created = await tx.mealRecipe.create({ data: mealData });

      if (components?.length) {
        await tx.mealComponent.createMany({
          data: components.map((c) => ({
            meal_id: created.id,
            ingredient_id: c.ingredient_id ?? null,
            sub_recipe_id: c.sub_recipe_id ?? null,
            quantity: c.quantity,
            unit: c.unit,
          })),
        });
      }

      return created;
    });

    const cost = await this.costEngine.calculateMealCost(meal.id);
    await this.prisma.mealRecipe.update({
      where: { id: meal.id },
      data: { computed_cost: cost },
    });

    return this.findOne(meal.id);
  }

  async update(id: string, dto: UpdateMealDto) {
    await this.findOne(id);

    if (dto.components !== undefined) {
      this.validateComponents(dto.components ?? []);
    }

    const { components, ...mealData } = dto;

    await this.prisma.$transaction(async (tx) => {
      await tx.mealRecipe.update({ where: { id }, data: mealData });

      if (components !== undefined) {
        await tx.mealComponent.deleteMany({ where: { meal_id: id } });
        if (components.length) {
          await tx.mealComponent.createMany({
            data: components.map((c) => ({
              meal_id: id,
              ingredient_id: c.ingredient_id ?? null,
              sub_recipe_id: c.sub_recipe_id ?? null,
              quantity: c.quantity,
              unit: c.unit,
            })),
          });
        }
      }
    });

    const cost = await this.costEngine.calculateMealCost(id);
    await this.prisma.mealRecipe.update({
      where: { id },
      data: { computed_cost: cost },
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.mealRecipe.delete({ where: { id } });
  }

  async getPricing() {
    return this.prisma.mealRecipe.findMany({
      select: {
        id: true,
        name: true,
        display_name: true,
        computed_cost: true,
        pricing_override: true,
        final_yield_weight: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  private validateComponents(
    components: { ingredient_id?: string; sub_recipe_id?: string }[],
  ) {
    for (const c of components) {
      if (!c.ingredient_id && !c.sub_recipe_id) {
        throw new BadRequestException(
          'Each component must have either ingredient_id or sub_recipe_id',
        );
      }
      if (c.ingredient_id && c.sub_recipe_id) {
        throw new BadRequestException(
          'Component cannot have both ingredient_id and sub_recipe_id',
        );
      }
    }
  }
}
