// Data import seed script — imports from CSV exports
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

function parseCSV(text) {
  const rows = [];
  const lines = text.replace(/\r/g, '').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const result = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQ = !inQ; }
      else if (line[i] === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += line[i]; }
    }
    result.push(cur.trim());
    rows.push(result);
  }
  return rows;
}

async function seedIngredients() {
  console.log('\n📦 Seeding ingredients...');
  const text = fs.readFileSync('D:\\NEW Culinary Inventory Sheet - 🛒 Inventory (Mar 6).csv', 'utf-8');
  const rows = parseCSV(text);
  // header: On Hand, Count Unit, Id, Ingredient Name, Need, Need Unit, Qty To Order, Qty Unit, Case Size, Case Unit, Cases To Order, Vendor, Vendor SKU, Case Price, ...

  let currentCategory = 'General';
  let count = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const col0 = row[0] || '';
    const col1 = row[1] || '';
    const col2 = row[2] || ''; // Id
    const col3 = row[3] || ''; // Name

    // Section header rows have text in col0 or col1 but no numeric Id
    const numId = parseInt(col2);
    if (isNaN(numId) || !col3) {
      // Extract section name — it appears in various columns
      const allText = row.join(' ');
      const m = allText.match(/([A-Z][A-Z &/()]+[A-Z)'])\s*-\s*\d+/);
      if (m) currentCategory = m[1].trim();
      continue;
    }

    const onHand = parseFloat(col0) || 0;
    const unit = col1.toLowerCase() === 'un' ? 'un' : 'Kgs';
    const casePrice = parseFloat(row[13]) || 0;
    const vendorRaw = row[11] || '';
    const vendor = vendorRaw.split(' - ')[0].trim();
    const sku = `ING-${col2}`;

    try {
      await prisma.ingredient.upsert({
        where: { sku },
        update: { stock: onHand, cost_per_unit: casePrice },
        create: {
          internal_name: col3,
          display_name: col3,
          sku,
          category: currentCategory,
          supplier_name: vendor || null,
          cost_per_unit: casePrice,
          unit,
          stock: onHand,
        },
      });
      count++;
    } catch (e) {
      console.error(`  ✗ ${col3}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${count} ingredients imported`);
}

async function seedSubRecipesAndMeals() {
  console.log('\n🍽️  Seeding sub-recipes and meals...');
  const text = fs.readFileSync('D:\\NEW Culinary App Database - Dish Masterlist.csv', 'utf-8');
  const rows = parseCSV(text);
  // header: Dish ID [001], Dish URL [002], Category [003], Dish Name [004], Sub-Recipe ID [005],
  //         Sub-Recipe Name [006], Per Portion [007], Unit [008], Price

  // Collect unique sub-recipes and meals
  const subRecipeMap = new Map(); // subRecipeCode -> name
  const mealMap = new Map();      // dishId -> {name, category, price}
  const components = [];          // {dishId, subRecipeCode, qty, unit}

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const dishId      = (row[0] || '').trim();
    const category    = (row[2] || '').trim();
    const dishName    = (row[3] || '').trim();
    const srId        = (row[4] || '').trim();
    const srName      = (row[5] || '').trim();
    const perPortion  = (row[6] || '').trim();
    const portionUnit = (row[7] || 'gr').trim() || 'gr';
    const priceRaw    = (row[8] || '').trim();

    if (!dishId || isNaN(parseInt(dishId))) continue;

    // Meal header row (has name)
    if (dishName && !mealMap.has(dishId)) {
      const price = priceRaw ? parseFloat(priceRaw.replace(/[$,]/g, '')) || null : null;
      mealMap.set(dishId, { name: dishName, category: category || 'Uncategorized', price });
    }

    // Sub-recipe component
    if (srId && srName) {
      if (!subRecipeMap.has(srId)) subRecipeMap.set(srId, srName);
      if (perPortion) {
        components.push({
          dishId,
          srId,
          qty: parseFloat(perPortion) || 1,
          unit: portionUnit,
        });
      }
    }
  }

  // Insert sub-recipes
  console.log(`  Inserting ${subRecipeMap.size} sub-recipes...`);
  const srDbIdMap = new Map(); // srId -> db uuid

  for (const [code, name] of subRecipeMap) {
    const srCode = `SR-${code}`;
    // Infer station from name suffix hints
    let stationTag = null;
    if (/oven\s+[tf]/i.test(name)) stationTag = 'Oven Station';
    else if (/sauce\s+[twf]/i.test(name)) stationTag = 'Sauce Station';
    else if (/veg\s+[tf]/i.test(name)) stationTag = 'Veg Station';
    else if (/pro\s+[tf]/i.test(name)) stationTag = 'Protein Station';
    else if (/brk|breakfast|sides/i.test(name)) stationTag = 'Breakfast + Sides Station';

    try {
      const sr = await prisma.subRecipe.upsert({
        where: { sub_recipe_code: srCode },
        update: {},
        create: {
          name,
          display_name: name,
          sub_recipe_code: srCode,
          station_tag: stationTag,
          priority: 3,
          base_yield_weight: 1,
          base_yield_unit: 'Kgs',
        },
      });
      srDbIdMap.set(code, sr.id);
    } catch (e) {
      console.error(`  ✗ SubRecipe ${name}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${srDbIdMap.size} sub-recipes inserted`);

  // Insert meals
  console.log(`  Inserting ${mealMap.size} meals...`);
  const mealDbIdMap = new Map(); // dishId -> db uuid

  for (const [dishId, { name, category, price }] of mealMap) {
    if (!name) continue;
    try {
      const meal = await prisma.mealRecipe.create({
        data: {
          name,
          display_name: name,
          category,
          pricing_override: price,
        },
      });
      mealDbIdMap.set(dishId, meal.id);
    } catch (e) {
      // If duplicate name, find it
      try {
        const existing = await prisma.mealRecipe.findFirst({ where: { name } });
        if (existing) mealDbIdMap.set(dishId, existing.id);
      } catch {}
      console.error(`  ✗ Meal ${name}: ${e.message}`);
    }
  }
  console.log(`  ✅ ${mealDbIdMap.size} meals inserted`);

  // Insert meal components (meal ↔ sub-recipe links)
  console.log(`  Inserting ${components.length} meal components...`);
  let compCount = 0;

  for (const { dishId, srId, qty, unit } of components) {
    const mealDbId = mealDbIdMap.get(dishId);
    const srDbId   = srDbIdMap.get(srId);
    if (!mealDbId || !srDbId) continue;

    try {
      await prisma.mealComponent.create({
        data: { meal_id: mealDbId, sub_recipe_id: srDbId, quantity: qty, unit },
      });
      compCount++;
    } catch (e) {
      // Ignore duplicate links
    }
  }
  console.log(`  ✅ ${compCount} meal components linked`);
}

async function main() {
  console.log('🚀 Starting data import...');
  try {
    await seedIngredients();
    await seedSubRecipesAndMeals();
    console.log('\n🎉 Import complete! Refresh your dashboard to see the data.');
  } catch (e) {
    console.error('❌ Import failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
