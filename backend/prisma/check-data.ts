import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkData() {
  const ingredientCount = await prisma.ingredient.count();
  const subRecipeCount = await prisma.subRecipe.count();
  const mealCount = await prisma.mealRecipe.count();
  
  console.log('\nDatabase Counts:');
  console.log(`  Ingredients: ${ingredientCount}`);
  console.log(`  Sub-Recipes: ${subRecipeCount}`);
  console.log(`  Meals: ${mealCount}`);
  
  // Sample some items
  const sampleIngredients = await prisma.ingredient.findMany({ take: 3 });
  const sampleSubRecipes = await prisma.subRecipe.findMany({ take: 3, include: { components: true } });
  const sampleMeals = await prisma.mealRecipe.findMany({ take: 3, include: { components: true } });
  
  console.log('\nSample Ingredients:');
  sampleIngredients.forEach(ing => console.log(`  - ${ing.internal_name} (${ing.sku})`));
  
  console.log('\nSample Sub-Recipes:');
  sampleSubRecipes.forEach(sr => console.log(`  - ${sr.name} (${sr.sub_recipe_code}) - ${sr.components.length} components`));
  
  console.log('\nSample Meals:');
  sampleMeals.forEach(meal => console.log(`  - ${meal.name} - ${meal.components.length} components, $${meal.pricing_override}`));
}

checkData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
