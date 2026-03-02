import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@culinaryops.com' },
    update: {},
    create: {
      email: 'admin@culinaryops.com',
      password_hash: hashedPassword,
      role: 'admin',
    },
  });
  console.log('✅ Created admin user:', admin.email);

  // Create sample ingredients
  const chicken = await prisma.ingredient.upsert({
    where: { sku: 'CHK-001' },
    update: {},
    create: {
      internal_name: 'Organic Chicken Breast',
      display_name: 'Chicken Breast',
      sku: 'CHK-001',
      category: 'Protein',
      location: 'Walk-in Freezer',
      supplier_name: 'Local Farm Co',
      trim_percentage: 10,
      base_weight: 1000,
      cost_per_unit: 12.5,
      allergen_tags: [],
    },
  });

  const rice = await prisma.ingredient.upsert({
    where: { sku: 'GRN-001' },
    update: {},
    create: {
      internal_name: 'Organic Brown Rice',
      display_name: 'Brown Rice',
      sku: 'GRN-001',
      category: 'Grains',
      location: 'Dry Storage',
      supplier_name: 'Grain Suppliers Inc',
      trim_percentage: 0,
      base_weight: 1000,
      cost_per_unit: 3.5,
      allergen_tags: [],
    },
  });

  const broccoli = await prisma.ingredient.upsert({
    where: { sku: 'VEG-001' },
    update: {},
    create: {
      internal_name: 'Fresh Broccoli',
      display_name: 'Broccoli',
      sku: 'VEG-001',
      category: 'Vegetables',
      location: 'Walk-in Cooler',
      supplier_name: 'Fresh Veggie Co',
      trim_percentage: 25,
      base_weight: 1000,
      cost_per_unit: 4.0,
      allergen_tags: [],
    },
  });

  const olive_oil = await prisma.ingredient.upsert({
    where: { sku: 'OIL-001' },
    update: {},
    create: {
      internal_name: 'Extra Virgin Olive Oil',
      display_name: 'Olive Oil',
      sku: 'OIL-001',
      category: 'Oils',
      location: 'Dry Storage',
      supplier_name: 'Mediterranean Imports',
      trim_percentage: 0,
      base_weight: 1000,
      cost_per_unit: 15.0,
      allergen_tags: [],
    },
  });

  console.log('✅ Created sample ingredients');

  // Create sample sub-recipe
  const grilledChicken = await prisma.subRecipe.create({
    data: {
      name: 'Grilled Chicken',
      sub_recipe_code: 'SR-CHK-001',
      instructions: 'Season chicken breast, grill until internal temp reaches 165°F',
      production_day: 'Monday',
      station_tag: 'Grill Station',
      base_yield_weight: 900,
      components: {
        create: [
          {
            ingredient_id: chicken.id,
            quantity: 1000,
            unit: 'g',
          },
          {
            ingredient_id: olive_oil.id,
            quantity: 20,
            unit: 'ml',
          },
        ],
      },
    },
  });

  console.log('✅ Created sample sub-recipe: Grilled Chicken');

  // Create sample meal
  const healthyBowl = await prisma.mealRecipe.create({
    data: {
      name: 'Healthy Chicken Bowl',
      display_name: 'Chicken & Rice Bowl',
      final_yield_weight: 450,
      pricing_override: 12.99,
      components: {
        create: [
          {
            sub_recipe_id: grilledChicken.id,
            quantity: 150,
            unit: 'g',
          },
          {
            ingredient_id: rice.id,
            quantity: 200,
            unit: 'g',
          },
          {
            ingredient_id: broccoli.id,
            quantity: 100,
            unit: 'g',
          },
        ],
      },
    },
  });

  console.log('✅ Created sample meal: Healthy Chicken Bowl');

  // Calculate costs
  console.log('🔧 Calculating costs...');
  
  // Sub-recipe cost calculation
  const chickenCost = (1000 * chicken.cost_per_unit * (1 + chicken.trim_percentage / 100)) / chicken.base_weight;
  const oilCost = (20 * olive_oil.cost_per_unit) / olive_oil.base_weight;
  const subRecipeCost = chickenCost + oilCost;

  await prisma.subRecipe.update({
    where: { id: grilledChicken.id },
    data: { computed_cost: subRecipeCost },
  });

  // Meal cost calculation
  const grilledChickenCost = (150 / grilledChicken.base_yield_weight) * subRecipeCost;
  const riceCost = (200 * rice.cost_per_unit) / rice.base_weight;
  const broccoliCost = (100 * broccoli.cost_per_unit * (1 + broccoli.trim_percentage / 100)) / broccoli.base_weight;
  const mealCost = grilledChickenCost + riceCost + broccoliCost;

  await prisma.mealRecipe.update({
    where: { id: healthyBowl.id },
    data: { computed_cost: mealCost },
  });

  console.log(`✅ Sub-recipe cost: $${subRecipeCost.toFixed(2)}`);
  console.log(`✅ Meal cost: $${mealCost.toFixed(2)}`);
  console.log(`✅ Profit margin: ${(((healthyBowl.pricing_override! - mealCost) / healthyBowl.pricing_override!) * 100).toFixed(1)}%`);

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Login credentials:');
  console.log('   Email: admin@culinaryops.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
