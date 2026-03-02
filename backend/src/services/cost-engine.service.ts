import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CostEngineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Recursively calculates the cost of a sub-recipe.
   * Handles nested sub-recipes to any depth.
   * Uses a visited set to detect circular references.
   */
  async calculateSubRecipeCost(
    subRecipeId: string,
    visited: Set<string> = new Set(),
  ): Promise<number> {
    if (visited.has(subRecipeId)) {
      console.warn(`Circular reference detected in sub-recipe: ${subRecipeId}`);
      return 0;
    }
    visited.add(subRecipeId);

    const subRecipe = await this.prisma.subRecipe.findUnique({
      where: { id: subRecipeId },
      include: {
        components: {
          include: {
            ingredient: true,
            child_sub_recipe: true,
          },
        },
      },
    });

    if (!subRecipe) return 0;

    let totalCost = 0;

    for (const component of subRecipe.components) {
      if (component.ingredient) {
        const ingredientCost = this.calculateIngredientCost(
          component.ingredient.cost_per_unit,
          component.ingredient.trim_percentage,
          component.quantity,
        );
        totalCost += ingredientCost;
      } else if (component.child_sub_recipe_id) {
        const childCost = await this.calculateSubRecipeCost(
          component.child_sub_recipe_id,
          new Set(visited),
        );
        totalCost += childCost * component.quantity;
      }
    }

    return parseFloat(totalCost.toFixed(4));
  }

  /**
   * Calculates the total cost of a meal recipe, including all sub-recipes and ingredients.
   */
  async calculateMealCost(mealId: string): Promise<number> {
    const meal = await this.prisma.mealRecipe.findUnique({
      where: { id: mealId },
      include: {
        components: {
          include: {
            ingredient: true,
            sub_recipe: true,
          },
        },
      },
    });

    if (!meal) return 0;

    let totalCost = 0;

    for (const component of meal.components) {
      if (component.ingredient) {
        const ingredientCost = this.calculateIngredientCost(
          component.ingredient.cost_per_unit,
          component.ingredient.trim_percentage,
          component.quantity,
        );
        totalCost += ingredientCost;
      } else if (component.sub_recipe_id) {
        const subRecipeCost = await this.calculateSubRecipeCost(
          component.sub_recipe_id,
        );
        totalCost += subRecipeCost * component.quantity;
      }
    }

    return parseFloat(totalCost.toFixed(4));
  }

  /**
   * Recalculates costs for all sub-recipes and meals that use a given ingredient.
   * Called when ingredient cost or trim percentage changes.
   */
  async recalculateForIngredient(ingredientId: string): Promise<void> {
    // Find all sub-recipes that directly use this ingredient
    const affectedSubRecipes = await this.prisma.subRecipeComponent.findMany({
      where: { ingredient_id: ingredientId },
      select: { sub_recipe_id: true },
    });

    const subRecipeIds = [
      ...new Set(affectedSubRecipes.map((r) => r.sub_recipe_id)),
    ];

    await this.recalculateSubRecipes(subRecipeIds);

    // Find all meals that directly use this ingredient
    const affectedMeals = await this.prisma.mealComponent.findMany({
      where: { ingredient_id: ingredientId },
      select: { meal_id: true },
    });

    const mealIds = [...new Set(affectedMeals.map((m) => m.meal_id))];
    await this.recalculateMeals(mealIds);
  }

  /**
   * Recalculates costs for a list of sub-recipes, then propagates up to meals.
   */
  async recalculateSubRecipes(subRecipeIds: string[]): Promise<void> {
    for (const id of subRecipeIds) {
      const cost = await this.calculateSubRecipeCost(id);
      await this.prisma.subRecipe.update({
        where: { id },
        data: { computed_cost: cost },
      });
    }

    // Propagate: find all parent sub-recipes that use these sub-recipes
    const parentComponents = await this.prisma.subRecipeComponent.findMany({
      where: { child_sub_recipe_id: { in: subRecipeIds } },
      select: { sub_recipe_id: true },
    });

    const parentIds = [
      ...new Set(parentComponents.map((p) => p.sub_recipe_id)),
    ].filter((id) => !subRecipeIds.includes(id));

    if (parentIds.length > 0) {
      await this.recalculateSubRecipes(parentIds);
    }

    // Propagate to meals that use these sub-recipes
    const mealComponents = await this.prisma.mealComponent.findMany({
      where: { sub_recipe_id: { in: subRecipeIds } },
      select: { meal_id: true },
    });

    const mealIds = [...new Set(mealComponents.map((m) => m.meal_id))];
    if (mealIds.length > 0) {
      await this.recalculateMeals(mealIds);
    }
  }

  async recalculateMeals(mealIds: string[]): Promise<void> {
    for (const id of mealIds) {
      const cost = await this.calculateMealCost(id);
      await this.prisma.mealRecipe.update({
        where: { id },
        data: { computed_cost: cost },
      });
    }
  }

  /**
   * Recalculates ALL sub-recipe and meal costs.
   * Use after bulk ingredient imports or migrations.
   */
  async recalculateAll(): Promise<{ subRecipes: number; meals: number }> {
    const allSubRecipes = await this.prisma.subRecipe.findMany({
      select: { id: true },
    });

    for (const { id } of allSubRecipes) {
      const cost = await this.calculateSubRecipeCost(id);
      await this.prisma.subRecipe.update({
        where: { id },
        data: { computed_cost: cost },
      });
    }

    const allMeals = await this.prisma.mealRecipe.findMany({
      select: { id: true },
    });

    for (const { id } of allMeals) {
      const cost = await this.calculateMealCost(id);
      await this.prisma.mealRecipe.update({
        where: { id },
        data: { computed_cost: cost },
      });
    }

    return { subRecipes: allSubRecipes.length, meals: allMeals.length };
  }

  /**
   * Cost of an ingredient accounting for trim loss.
   * effective_cost = cost_per_unit / (1 - trim_percentage / 100)
   */
  private calculateIngredientCost(
    costPerUnit: number,
    trimPercentage: number,
    quantity: number,
  ): number {
    const trimFactor = trimPercentage > 0 ? 1 - trimPercentage / 100 : 1;
    return (costPerUnit / trimFactor) * quantity;
  }
}
