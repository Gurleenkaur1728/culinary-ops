// update-from-exports.js
// Imports data from:
//   1. Sub-Recipe Masterlist (1).csv  → updates sub-recipes + creates ingredient components
//   2. wc-product-export CSV          → updates meal recipes with nutritional data + images
//   3. Dish Masterlist.csv            → used as bridge for WC → meal name matching

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// ─── Proper CSV parser (handles multi-line quoted fields) ─────────────────────
function parseCSV(text) {
  const rows = [];
  let cur = '', inQ = false, curRow = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '\r') continue;
    if (ch === '"') {
      // Handle escaped double-quotes inside quoted fields ("")
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) {
      curRow.push(cur.trim());
      cur = '';
    } else if (ch === '\n' && !inQ) {
      curRow.push(cur.trim());
      cur = '';
      if (curRow.some(c => c.length > 0)) rows.push(curRow);
      curRow = [];
    } else {
      cur += ch;
    }
  }
  // Last field/row
  curRow.push(cur.trim());
  if (curRow.some(c => c.length > 0)) rows.push(curRow);
  return rows;
}

// ─── Station name normalizer ──────────────────────────────────────────────────
function mapStationTag(raw) {
  if (!raw) return null;
  // Format is "{Name} - {ID}", e.g., "Veg - 017"
  const namePart = (raw.split(' - ')[0] || raw).trim().toLowerCase();
  if (namePart === 'veg') return 'Veg Station';
  if (namePart === 'sauce' || namePart === 'sauce w') return 'Sauce Station';
  if (namePart === 'pro' || namePart === 'pro t' || namePart === 'protein') return 'Protein Station';
  if (namePart === 'oven' || namePart === 'oven w' || namePart === 'ovent' ||
      namePart === 'bake' || namePart === 'baking') return 'Oven Station';
  if (namePart === 'breakfast' || namePart === 'break' || namePart === 'brk') return 'Breakfast + Sides Station';
  if (namePart === 'pack' || namePart === 'packing' || namePart === 'packaging' || namePart === 'po') return 'Packaging Station';
  if (namePart === 'batch') return 'Batch Station';
  if (namePart.startsWith('snack')) return 'Snacks Station';
  return raw.trim();
}

// ─── PART 1: Import Sub-Recipe Masterlist ─────────────────────────────────────
async function importSubRecipes() {
  console.log('\n📋 Importing Sub-Recipe Masterlist...');
  const filePath = 'D:\\NEW Culinary App Database - Sub-Recipe Masterlist (1).csv';
  const text = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(text);

  // Skip header rows (the header is multi-line and becomes several rows until actual data)
  // Real data rows have a numeric value in col[3] (Sub-Recipe ID)
  const dataRows = rows.filter(row => {
    const id = parseInt(row[3] || '');
    return !isNaN(id) && id > 0;
  });

  console.log(`  Found ${dataRows.length} data rows`);

  // Separate sub-recipe headers from ingredient rows
  // Sub-recipe header: col[5] (Sub-Recipe Name) is non-empty, col[6] (Ingredient ID) is empty
  // Ingredient row:    col[6] (Ingredient ID) is non-empty, col[5] is empty
  const srHeaders = dataRows.filter(r => r[5] && r[5].trim() && !(r[6] && r[6].trim()));
  const ingRows   = dataRows.filter(r => r[6] && r[6].trim());

  console.log(`  ${srHeaders.length} sub-recipe definitions, ${ingRows.length} ingredient rows`);

  // ── Step 1: Upsert sub-recipes ──────────────────────────────────────────────
  let srUpdateCount = 0;
  const srDbMap = new Map(); // srNumericId -> db uuid

  for (const row of srHeaders) {
    const srNumId    = row[3].trim();
    const station    = row[0].trim();
    const day        = row[1].trim() || null;
    const priority   = parseInt(row[2]) || 3;
    const name       = row[5].trim();
    const yieldQty   = parseFloat(row[9]) || 1;
    const yieldUnit  = row[10].trim() || 'Kgs';
    const instructions = row[11] ? row[11].trim() || null : null;
    const stationTag = mapStationTag(station);
    const srCode     = `SR-${srNumId}`;

    try {
      const sr = await prisma.subRecipe.upsert({
        where: { sub_recipe_code: srCode },
        update: {
          station_tag: stationTag,
          production_day: day,
          priority,
          base_yield_weight: yieldQty,
          base_yield_unit: yieldUnit,
          instructions: instructions,
        },
        create: {
          name,
          display_name: name,
          sub_recipe_code: srCode,
          station_tag: stationTag,
          production_day: day,
          priority,
          base_yield_weight: yieldQty,
          base_yield_unit: yieldUnit,
          instructions: instructions,
        },
      });
      srDbMap.set(srNumId, sr.id);
      srUpdateCount++;
    } catch (e) {
      console.error(`  ✗ SubRecipe ${name} (${srCode}): ${e.message}`);
    }
  }
  console.log(`  ✅ ${srUpdateCount} sub-recipes upserted`);

  // ── Step 2: Delete existing components for updated sub-recipes ──────────────
  const srDbIds = Array.from(srDbMap.values());
  if (srDbIds.length > 0) {
    const deleted = await prisma.subRecipeComponent.deleteMany({
      where: { sub_recipe_id: { in: srDbIds } },
    });
    console.log(`  🗑️  Cleared ${deleted.count} old ingredient components`);
  }

  // ── Step 3: Resolve ingredient IDs from DB ──────────────────────────────────
  // Build a map of ING-{id} → DB uuid
  const allIngSKUs = [...new Set(ingRows.map(r => `ING-${r[6].trim()}`))];
  const ingredients = await prisma.ingredient.findMany({
    where: { sku: { in: allIngSKUs } },
    select: { id: true, sku: true },
  });
  const ingDbMap = new Map(ingredients.map(i => [i.sku, i.id]));
  console.log(`  Found ${ingDbMap.size}/${allIngSKUs.length} ingredients in DB`);

  // ── Step 4: Create sub-recipe components ────────────────────────────────────
  let compCount = 0, compSkipped = 0;

  for (const row of ingRows) {
    const srNumId    = row[3].trim();
    const ingNumId   = row[6].trim();
    const trimPct    = parseFloat(row[8]) || 0;
    const qty        = parseFloat(row[9]) || 0;
    const unit       = row[10].trim() || 'Kgs';

    const srDbId  = srDbMap.get(srNumId);
    const ingDbId = ingDbMap.get(`ING-${ingNumId}`);

    if (!srDbId) { compSkipped++; continue; }
    if (!ingDbId) { compSkipped++; continue; }
    if (qty === 0) { compSkipped++; continue; }

    try {
      await prisma.subRecipeComponent.create({
        data: {
          sub_recipe_id: srDbId,
          ingredient_id: ingDbId,
          quantity: qty,
          unit,
          trim_percentage: trimPct,
        },
      });
      compCount++;
    } catch (e) {
      // ignore duplicate
    }
  }
  console.log(`  ✅ ${compCount} ingredient components created (${compSkipped} skipped)`);
}

// ─── PART 2: Import WooCommerce Nutritional + Image Data ─────────────────────
async function importWooCommerceData() {
  console.log('\n🛒 Importing WooCommerce product data...');

  const wcPath   = 'D:\\NEW Culinary App Database - wc-product-export-26-2-2026-1772144598463.csv';
  const dishPath = 'D:\\NEW Culinary App Database - Dish Masterlist.csv';

  // ── Step 1: Parse WC CSV ────────────────────────────────────────────────────
  const wcText = fs.readFileSync(wcPath, 'utf-8');
  const wcRows = parseCSV(wcText);

  // WC CSV columns (0-indexed):
  // 0:ID  1:Type  2:SKU  3:InternalSKU  4:Name  8:ShortDesc  9:Desc
  // 25:SalePrice  26:RegularPrice  30:Images
  // 47:Attr1Name  48:Attr1Value  51:Attr2Name  52:Attr2Value
  // 55:Attr3Name  56:Attr3Value  59:Attr4Name  60:Attr4Value

  const wcByDishId = new Map(); // dishId (number) → WC data
  for (let i = 1; i < wcRows.length; i++) {
    const row = wcRows[i];
    const sku = (row[2] || '').trim();
    if (!sku.startsWith('MEAL-')) continue;

    const dishId = parseInt(sku.replace('MEAL-', ''));
    if (isNaN(dishId)) continue;

    // Parse nutritional attributes (up to 4 attribute slots, each has name + value)
    const attrs = {};
    for (let a = 0; a < 4; a++) {
      const nameIdx  = 47 + a * 4;
      const valueIdx = 48 + a * 4;
      const attrName  = (row[nameIdx]  || '').toLowerCase().trim();
      const attrValue = (row[valueIdx] || '').trim();
      if (attrName) attrs[attrName] = attrValue;
    }

    const priceRaw  = (row[26] || '').replace(/[$,]/g, '');
    const imageUrl  = (row[30] || '').split('|')[0].trim() || null; // take first image if multiple

    wcByDishId.set(dishId, {
      shortDesc: (row[8]  || '').trim() || null,
      desc:      (row[9]  || '').trim() || null,
      price:     priceRaw ? parseFloat(priceRaw) || null : null,
      imageUrl,
      calories:  attrs['calories']  ? parseInt(attrs['calories'])   || null : null,
      protein:   attrs['protein']   ? parseFloat(attrs['protein'])  || null : null,
      carbs:     attrs['carbs']     ? parseFloat(attrs['carbs'])    || null : null,
      fat:       attrs['fat']       ? parseFloat(attrs['fat'])      || null : null,
    });
  }
  console.log(`  Found ${wcByDishId.size} MEAL-* products in WooCommerce export`);

  // ── Step 2: Parse Dish Masterlist to get dishId → mealName ─────────────────
  const dishText = fs.readFileSync(dishPath, 'utf-8');
  const dishRows = parseCSV(dishText);
  // Columns: 0:DishID  1:URL  2:Category  3:DishName  4:SubRecipeID ...

  const dishNameToWcData = new Map(); // mealName → WC data
  for (let i = 1; i < dishRows.length; i++) {
    const row     = dishRows[i];
    const dishId  = parseInt((row[0] || '').trim());
    const name    = (row[3] || '').trim();
    if (isNaN(dishId) || !name) continue;

    const wcData = wcByDishId.get(dishId);
    if (wcData && !dishNameToWcData.has(name)) {
      dishNameToWcData.set(name, wcData);
    }
  }
  console.log(`  Matched ${dishNameToWcData.size} meal names to WooCommerce data`);

  // ── Step 3: Update MealRecipes in DB ────────────────────────────────────────
  const meals = await prisma.mealRecipe.findMany({ select: { id: true, name: true } });
  let updateCount = 0;

  for (const meal of meals) {
    const wcData = dishNameToWcData.get(meal.name);
    if (!wcData) continue;

    try {
      await prisma.mealRecipe.update({
        where: { id: meal.id },
        data: {
          short_description: wcData.shortDesc,
          description:       wcData.desc || wcData.shortDesc,
          image_url:         wcData.imageUrl,
          pricing_override:  wcData.price,
          calories:          wcData.calories,
          protein_g:         wcData.protein,
          carbs_g:           wcData.carbs,
          fat_g:             wcData.fat,
        },
      });
      updateCount++;
    } catch (e) {
      console.error(`  ✗ Meal "${meal.name}": ${e.message}`);
    }
  }
  console.log(`  ✅ ${updateCount}/${meals.length} meal recipes updated from WooCommerce`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 Starting data update from exports...');
  try {
    await importSubRecipes();
    await importWooCommerceData();
    console.log('\n🎉 Done! Refresh your dashboard to see the updated data.');
  } catch (e) {
    console.error('❌ Update failed:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
