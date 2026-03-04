import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionPlanDto, UpdateProductionPlanDto } from './dto/production-plan.dto';

@Injectable()
export class ProductionPlansService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.productionPlan.findMany({
      include: {
        items: {
          select: {
            id: true,
            quantity: true,
            meal: { select: { id: true, display_name: true, category: true } },
          },
        },
      },
      orderBy: { week_start: 'desc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            meal: {
              select: {
                id: true,
                name: true,
                display_name: true,
                category: true,
                allergen_tags: true,
                computed_cost: true,
              },
            },
          },
          orderBy: [{ meal: { category: 'asc' } }],
        },
      },
    });
    if (!plan) throw new NotFoundException('Production plan not found');
    return plan;
  }

  async create(dto: CreateProductionPlanDto) {
    const { items, week_start, ...planData } = dto;

    return this.prisma.$transaction(async (tx) => {
      const plan = await tx.productionPlan.create({
        data: {
          ...planData,
          week_start: new Date(week_start),
        },
      });

      if (items?.length) {
        await tx.productionPlanItem.createMany({
          data: items.map((item) => ({
            plan_id: plan.id,
            meal_id: item.meal_id,
            quantity: item.quantity,
          })),
        });
      }

      return plan;
    });
  }

  async update(id: string, dto: UpdateProductionPlanDto) {
    await this.findOne(id);
    const { items, week_start, ...planData } = dto;

    await this.prisma.$transaction(async (tx) => {
      await tx.productionPlan.update({
        where: { id },
        data: {
          ...planData,
          ...(week_start ? { week_start: new Date(week_start) } : {}),
        },
      });

      if (items !== undefined) {
        await tx.productionPlanItem.deleteMany({ where: { plan_id: id } });
        if (items.length) {
          await tx.productionPlanItem.createMany({
            data: items.map((item) => ({
              plan_id: id,
              meal_id: item.meal_id,
              quantity: item.quantity,
            })),
          });
        }
      }
    });

    return this.findOne(id);
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.productionPlan.delete({ where: { id } });
  }

  /** Sub-recipe prep sheet: aggregated sub-recipe quantities, grouped by station */
  async getSubRecipeReport(id: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: {
        items: {
          where: { quantity: { gt: 0 } },
          include: {
            meal: {
              include: {
                components: {
                  include: {
                    sub_recipe: {
                      select: {
                        id: true,
                        name: true,
                        sub_recipe_code: true,
                        station_tag: true,
                        production_day: true,
                        priority: true,
                        instructions: true,
                        base_yield_weight: true,
                        base_yield_unit: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Production plan not found');

    // Aggregate sub-recipe totals
    const totals = new Map<
      string,
      { subRecipe: any; total: number; unit: string; mealBreakdown: { meal: string; qty: number }[] }
    >();

    for (const item of plan.items) {
      for (const component of item.meal.components) {
        if (!component.sub_recipe) continue;
        const key = component.sub_recipe.id;
        const portionQty = component.quantity * item.quantity;
        const existing = totals.get(key);
        if (existing) {
          existing.total += portionQty;
          existing.mealBreakdown.push({ meal: item.meal.display_name, qty: portionQty });
        } else {
          totals.set(key, {
            subRecipe: component.sub_recipe,
            total: portionQty,
            unit: component.unit,
            mealBreakdown: [{ meal: item.meal.display_name, qty: portionQty }],
          });
        }
      }
    }

    const rows = Array.from(totals.values()).map(({ subRecipe, total, unit, mealBreakdown }) => ({
      id: subRecipe.id,
      name: subRecipe.name,
      sub_recipe_code: subRecipe.sub_recipe_code,
      station_tag: subRecipe.station_tag,
      production_day: subRecipe.production_day,
      priority: subRecipe.priority,
      instructions: subRecipe.instructions,
      base_yield_weight: subRecipe.base_yield_weight,
      base_yield_unit: subRecipe.base_yield_unit,
      total_quantity: parseFloat(total.toFixed(3)),
      unit,
      meal_breakdown: mealBreakdown,
    }));

    // Sort by station then priority
    rows.sort((a, b) => {
      const stationCmp = (a.station_tag ?? 'ZZZ').localeCompare(b.station_tag ?? 'ZZZ');
      if (stationCmp !== 0) return stationCmp;
      return (a.priority ?? 3) - (b.priority ?? 3);
    });

    // Group by station
    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) {
      const key = row.station_tag ?? 'Unassigned';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(row);
    }

    return { plan_id: id, week_label: plan.week_label, grouped_by_station: grouped, total_sub_recipes: rows.length };
  }

  /** Shopping list: aggregated ingredient quantities, grouped by category */
  async getShoppingList(id: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: {
        items: {
          where: { quantity: { gt: 0 } },
          include: {
            meal: {
              include: {
                components: {
                  include: {
                    ingredient: true,
                    sub_recipe: {
                      include: {
                        components: {
                          include: {
                            ingredient: true,
                            child_sub_recipe: {
                              include: {
                                components: { include: { ingredient: true } },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!plan) throw new NotFoundException('Production plan not found');

    const ingredientTotals = new Map<
      string,
      { ingredient: any; total: number; unit: string }
    >();

    for (const item of plan.items) {
      this.aggregateIngredientsFromMeal(item.meal, item.quantity, ingredientTotals);
    }

    const rows = Array.from(ingredientTotals.values())
      .map(({ ingredient, total, unit }) => ({
        id: ingredient.id,
        internal_name: ingredient.internal_name,
        display_name: ingredient.display_name,
        sku: ingredient.sku,
        category: ingredient.category,
        supplier_name: ingredient.supplier_name,
        location: ingredient.location,
        total_quantity: parseFloat(total.toFixed(3)),
        unit,
        cost_per_unit: ingredient.cost_per_unit,
        allergen_tags: ingredient.allergen_tags,
      }))
      .sort((a, b) => {
        const catCmp = a.category.localeCompare(b.category);
        if (catCmp !== 0) return catCmp;
        return a.internal_name.localeCompare(b.internal_name);
      });

    // Group by category
    const grouped: Record<string, typeof rows> = {};
    for (const row of rows) {
      if (!grouped[row.category]) grouped[row.category] = [];
      grouped[row.category].push(row);
    }

    return {
      plan_id: id,
      week_label: plan.week_label,
      grouped_by_category: grouped,
      total_ingredients: rows.length,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private aggregateIngredientsFromMeal(
    meal: any,
    qty: number,
    totals: Map<string, { ingredient: any; total: number; unit: string }>,
  ) {
    for (const component of meal.components) {
      if (component.ingredient) {
        this.addIngredient(totals, component.ingredient, component.quantity * qty, component.unit);
      } else if (component.sub_recipe) {
        this.aggregateIngredientsFromSubRecipe(component.sub_recipe, component.quantity * qty, totals);
      }
    }
  }

  private aggregateIngredientsFromSubRecipe(
    subRecipe: any,
    multiplier: number,
    totals: Map<string, { ingredient: any; total: number; unit: string }>,
    visited: Set<string> = new Set(),
  ) {
    if (visited.has(subRecipe.id)) return;
    visited.add(subRecipe.id);

    for (const component of subRecipe.components ?? []) {
      if (component.ingredient) {
        this.addIngredient(totals, component.ingredient, component.quantity * multiplier, component.unit);
      } else if (component.child_sub_recipe) {
        this.aggregateIngredientsFromSubRecipe(
          component.child_sub_recipe,
          component.quantity * multiplier,
          totals,
          new Set(visited),
        );
      }
    }
  }

  private addIngredient(
    totals: Map<string, { ingredient: any; total: number; unit: string }>,
    ingredient: any,
    qty: number,
    unit: string,
  ) {
    const curr = totals.get(ingredient.id);
    if (curr) {
      curr.total += qty;
    } else {
      totals.set(ingredient.id, { ingredient, total: qty, unit });
    }
  }
}
