import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const STATION_ORDER = ['Veg', 'Sauce', 'Oven', 'Pro', 'Packing', 'Breakfast', 'Batch'];

function stationSortKey(station: string | null): number {
  if (!station) return 99;
  const idx = STATION_ORDER.findIndex((s) => station.toLowerCase().includes(s.toLowerCase()));
  return idx === -1 ? 98 : idx;
}

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCookingReport(planId: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id: planId },
      include: {
        items: {
          include: {
            meal: {
              include: {
                subRecipes: {
                  include: {
                    subRecipe: {
                      include: {
                        ingredients: {
                          include: {
                            ingredient: true,
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

    // Build SR total portions map: srId → { sr, totalPortions }
    const srPortions = new Map<string, { sr: any; totalPortions: number }>();

    for (const item of plan.items) {
      for (const msr of item.meal.subRecipes) {
        const key = msr.subRecipeId;
        const existing = srPortions.get(key);
        if (existing) {
          existing.totalPortions += item.quantity;
        } else {
          srPortions.set(key, { sr: msr.subRecipe, totalPortions: item.quantity });
        }
      }
    }

    // Build per-station structure
    const stationMap = new Map<string, any[]>();

    for (const [srId, { sr, totalPortions }] of srPortions) {
      const stationKey = sr.station || 'Unassigned';

      const ingredients = sr.ingredients.map((sri: any) => {
        const totalBatch = (sri.weight ?? 0) * totalPortions;
        const isWeight = sri.unit && (sri.unit.toLowerCase().includes('gr') || sri.unit.toLowerCase().includes('kg'));
        const totalKgs = isWeight ? totalBatch / 1000 : null;
        return {
          ingredientId: sri.ingredientId,
          ingredientName: sri.ingredient.name,
          perPortion: sri.weight,
          unit: sri.unit,
          trimPct: sri.trimPct,
          totalBatch: parseFloat(totalBatch.toFixed(3)),
          totalKgs: totalKgs !== null ? parseFloat(totalKgs.toFixed(3)) : null,
        };
      });

      const srEntry = {
        srId,
        srName: sr.name,
        priority: sr.priority ?? 99,
        prepInstructions: sr.prepInstructions ?? '',
        totalPortions,
        ingredients,
      };

      if (!stationMap.has(stationKey)) stationMap.set(stationKey, []);
      stationMap.get(stationKey)!.push(srEntry);
    }

    // Sort SRs within each station by priority
    for (const [, srs] of stationMap) {
      srs.sort((a: any, b: any) => a.priority - b.priority);
    }

    // Build final array sorted by station order
    const result: any[] = [];
    const allStations = Array.from(stationMap.keys()).sort(
      (a, b) => stationSortKey(a) - stationSortKey(b),
    );
    for (const station of allStations) {
      result.push({ station, subRecipes: stationMap.get(station)! });
    }

    return result;
  }

  async getShoppingList(planId: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id: planId },
      include: {
        items: {
          include: {
            meal: {
              include: {
                subRecipes: {
                  include: {
                    subRecipe: {
                      include: {
                        ingredients: {
                          include: { ingredient: true },
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

    const ingredientTotals = new Map<string, { name: string; totalQty: number; unit: string }>();

    for (const item of plan.items) {
      for (const msr of item.meal.subRecipes) {
        for (const sri of msr.subRecipe.ingredients) {
          const key = sri.ingredientId;
          const qty = (sri.weight ?? 0) * item.quantity;
          const existing = ingredientTotals.get(key);
          if (existing) {
            existing.totalQty += qty;
          } else {
            ingredientTotals.set(key, {
              name: sri.ingredient.name,
              totalQty: qty,
              unit: sri.unit ?? '',
            });
          }
        }
      }
    }

    return Array.from(ingredientTotals.entries())
      .map(([ingredientId, { name, totalQty, unit }]) => {
        const isWeight = unit && (unit.toLowerCase().includes('gr') || unit.toLowerCase().includes('kg'));
        return {
          ingredientId,
          ingredientName: name,
          totalQty: parseFloat(totalQty.toFixed(3)),
          unit,
          totalKgs: isWeight ? parseFloat((totalQty / 1000).toFixed(3)) : null,
        };
      })
      .sort((a, b) => a.ingredientName.localeCompare(b.ingredientName));
  }

  async getSubRecipeReport(planId: string) {
    // Similar to cooking report but simplified (no station grouping needed for this endpoint)
    return this.getCookingReport(planId);
  }

  async getPlanStats(planId: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id: planId },
      include: {
        items: {
          include: { meal: { select: { id: true, name: true, category: true, price: true } } },
        },
      },
    });
    if (!plan) throw new NotFoundException('Production plan not found');
    return plan;
  }
}
