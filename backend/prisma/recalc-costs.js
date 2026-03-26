// recalc-costs.js — Recalculates computed_cost for all sub-recipes and meals
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function recalc() {
  console.log('Recalculating sub-recipe costs...');

  const subRecipes = await prisma.subRecipe.findMany({
    include: {
      components: {
        include: { ingredient: true, child_sub_recipe: true },
      },
    },
  });

  const costMap = new Map();

  function calcCost(sr) {
    if (costMap.has(sr.id)) return costMap.get(sr.id);
    let total = 0;
    for (const comp of sr.components) {
      if (comp.ingredient) {
        const trimFactor = comp.trim_percentage > 0 ? 1 / (1 - comp.trim_percentage / 100) : 1;
        total += comp.quantity * trimFactor * (comp.ingredient.cost_per_unit || 0);
      } else if (comp.child_sub_recipe_id) {
        const child = subRecipes.find(s => s.id === comp.child_sub_recipe_id);
        if (child) {
          const childCost  = calcCost(child);
          const childYield = child.base_yield_weight || 1;
          total += (childCost / childYield) * comp.quantity;
        }
      }
    }
    costMap.set(sr.id, total);
    return total;
  }

  for (const sr of subRecipes) calcCost(sr);

  let srUpdated = 0;
  for (const [id, cost] of costMap.entries()) {
    await prisma.subRecipe.update({ where: { id }, data: { computed_cost: cost } });
    srUpdated++;
    if (srUpdated % 100 === 0) process.stdout.write('.');
  }
  console.log(`\n  Sub-recipes updated: ${srUpdated}`);

  console.log('Recalculating meal costs...');
  const meals = await prisma.mealRecipe.findMany({
    include: {
      components: { include: { ingredient: true, sub_recipe: true } },
    },
  });

  let mealUpdated = 0;
  for (const meal of meals) {
    let total = 0;
    for (const comp of meal.components) {
      if (comp.ingredient) {
        total += comp.quantity * (comp.ingredient.cost_per_unit || 0);
      } else if (comp.sub_recipe) {
        const srCost  = costMap.get(comp.sub_recipe.id) ?? comp.sub_recipe.computed_cost ?? 0;
        const srYield = comp.sub_recipe.base_yield_weight || 1;
        total += (srCost / srYield) * comp.quantity;
      }
    }
    await prisma.mealRecipe.update({ where: { id: meal.id }, data: { computed_cost: total } });
    mealUpdated++;
  }
  console.log(`  Meals updated: ${mealUpdated}`);

  await prisma.$disconnect();
  console.log('Done!');
}

recalc().catch(e => { console.error(e); process.exit(1); });
