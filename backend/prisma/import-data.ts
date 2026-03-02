import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface SubRecipeRow {
  station: string;
  day: string;
  priority: string;
  subRecipeId: string;
  subRecipeUrl: string;
  subRecipeName: string;
  ingredientId: string;
  ingredientName: string;
  trimPercent: string;
  weightQuantity: string;
  unit: string;
  prepInstructions: string;
}

interface DishRow {
  dishId: string;
  dishUrl: string;
  category: string;
  dishName: string;
  subRecipeId: string;
  subRecipeName: string;
  perPortion: string;
  unit: string;
  price: string;
}

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim());
      currentField = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // Skip \n in \r\n
      }
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim());
        if (currentLine.some(field => field !== '')) {
          lines.push(currentLine);
        }
        currentLine = [];
        currentField = '';
      }
    } else {
      currentField += char;
    }
  }

  // Push last line if exists
  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim());
    if (currentLine.some(field => field !== '')) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function cleanValue(value: string): string {
  return value.replace(/\[0+\d+\]/g, '').trim();
}

async function importData() {
  console.log('Starting data import...\n');

  // Read CSV files
  const subRecipePath = path.join(__dirname, '../../NEW Culinary App Database - Sub-Recipe Masterlist (1).csv');
  const dishPath = path.join(__dirname, '../../NEW Culinary App Database - Dish Masterlist (1).csv');

  const subRecipeContent = fs.readFileSync(subRecipePath, 'utf-8');
  const dishContent = fs.readFileSync(dishPath, 'utf-8');

  const subRecipeLines = parseCSV(subRecipeContent);
  const dishLines = parseCSV(dishContent);

  console.log(`Found ${subRecipeLines.length - 1} sub-recipe rows`);
  console.log(`Found ${dishLines.length - 1} dish rows\n`);

  // Skip header rows
  const subRecipeRows = subRecipeLines.slice(1);
  const dishRows = dishLines.slice(1);

  // Group sub-recipes by ID
  const subRecipeGroups = new Map<string, SubRecipeRow[]>();
  for (const row of subRecipeRows) {
    if (row.length < 12) continue;
    
    const subRecipeId = cleanValue(row[3]);
    if (!subRecipeId) continue;

    const rowData: SubRecipeRow = {
      station: cleanValue(row[0]),
      day: cleanValue(row[1]),
      priority: cleanValue(row[2]),
      subRecipeId,
      subRecipeUrl: cleanValue(row[4]),
      subRecipeName: cleanValue(row[5]),
      ingredientId: cleanValue(row[6]),
      ingredientName: cleanValue(row[7]),
      trimPercent: cleanValue(row[8]),
      weightQuantity: cleanValue(row[9]),
      unit: cleanValue(row[10]),
      prepInstructions: cleanValue(row[11]),
    };

    if (!subRecipeGroups.has(subRecipeId)) {
      subRecipeGroups.set(subRecipeId, []);
    }
    subRecipeGroups.get(subRecipeId)!.push(rowData);
  }

  // Group dishes by ID
  const dishGroups = new Map<string, DishRow[]>();
  for (const row of dishRows) {
    if (row.length < 9) continue;
    
    const dishId = cleanValue(row[0]);
    if (!dishId) continue;

    const rowData: DishRow = {
      dishId,
      dishUrl: cleanValue(row[1]),
      category: cleanValue(row[2]),
      dishName: cleanValue(row[3]),
      subRecipeId: cleanValue(row[4]),
      subRecipeName: cleanValue(row[5]),
      perPortion: cleanValue(row[6]),
      unit: cleanValue(row[7]),
      price: cleanValue(row[8]),
    };

    if (!dishGroups.has(dishId)) {
      dishGroups.set(dishId, []);
    }
    dishGroups.get(dishId)!.push(rowData);
  }

  console.log(`Grouped into ${subRecipeGroups.size} unique sub-recipes`);
  console.log(`Grouped into ${dishGroups.size} unique dishes\n`);

  // Import ingredients from sub-recipes
  console.log('Importing ingredients...');
  const ingredientMap = new Map<string, any>();
  const oldIdToNewIdMap = new Map<string, string>();
  
  for (const [_, rows] of subRecipeGroups) {
    for (const row of rows) {
      if (row.ingredientId && row.ingredientName && !ingredientMap.has(row.ingredientId)) {
        ingredientMap.set(row.ingredientId, {
          internal_name: row.ingredientName,
          display_name: row.ingredientName,
          sku: `ING-${row.ingredientId}`,
          category: row.station || 'General',
          base_weight: 1.0,
          cost_per_unit: 0,
          allergen_tags: [],
        });
      }
    }
  }

  // Create ingredients in batches
  const ingredientEntries = Array.from(ingredientMap.entries());
  for (let i = 0; i < ingredientEntries.length; i += 100) {
    const batch = ingredientEntries.slice(i, i + 100);
    await Promise.all(
      batch.map(async ([oldId, data]) => {
        try {
          const ingredient = await prisma.ingredient.upsert({
            where: { sku: data.sku },
            create: data,
            update: data,
          });
          oldIdToNewIdMap.set(oldId, ingredient.id);
        } catch (err: any) {
          console.error(`Error creating ingredient ${oldId}:`, err.message);
        }
      })
    );
    console.log(`  Imported ${Math.min(i + 100, ingredientEntries.length)} / ${ingredientEntries.length} ingredients`);
  }

  console.log(`✓ Imported ${ingredientMap.size} ingredients\n`);

  // Import sub-recipes
  console.log('Importing sub-recipes...');
  let subRecipeCount = 0;
  const oldSubRecipeIdToNewIdMap = new Map<string, string>();
  
  for (const [subRecipeId, rows] of Array.from(subRecipeGroups.entries())) {
    const firstRow = rows[0];
    const components = rows
      .filter(row => row.ingredientId && row.ingredientName && oldIdToNewIdMap.has(row.ingredientId))
      .map(row => ({
        ingredient_id: oldIdToNewIdMap.get(row.ingredientId),
        quantity: parseFloat(row.weightQuantity) || 0,
        unit: row.unit || 'unit',
      }));

    try {
      const subRecipe = await prisma.subRecipe.upsert({
        where: { sub_recipe_code: `SR-${subRecipeId}` },
        create: {
          name: firstRow.subRecipeName,
          sub_recipe_code: `SR-${subRecipeId}`,
          station_tag: firstRow.station || 'General',
          production_day: firstRow.day || 'Monday',
          instructions: firstRow.prepInstructions,
          base_yield_weight: 1.0,
          components: {
            create: components,
          },
        },
        update: {
          name: firstRow.subRecipeName,
          station_tag: firstRow.station || 'General',
          production_day: firstRow.day || 'Monday',
          instructions: firstRow.prepInstructions,
        },
      });
      oldSubRecipeIdToNewIdMap.set(subRecipeId, subRecipe.id);
      subRecipeCount++;
      
      if (subRecipeCount % 50 === 0) {
        console.log(`  Imported ${subRecipeCount} / ${subRecipeGroups.size} sub-recipes`);
      }
    } catch (err: any) {
      console.error(`Error creating sub-recipe ${subRecipeId}:`, err.message);
    }
  }

  console.log(`✓ Imported ${subRecipeCount} sub-recipes\n`);

  // Import meals (dishes)
  console.log('Importing meals...');
  let mealCount = 0;
  
  for (const [dishId, rows] of Array.from(dishGroups.entries())) {
    const firstRow = rows.find(r => r.dishName) || rows[0];
    const components = rows
      .filter(row => row.subRecipeId && row.perPortion && oldSubRecipeIdToNewIdMap.has(row.subRecipeId))
      .map(row => ({
        sub_recipe_id: oldSubRecipeIdToNewIdMap.get(row.subRecipeId),
        quantity: parseFloat(row.perPortion) || 0,
        unit: row.unit || 'unit',
      }));

    const priceStr = firstRow.price.replace('$', '').replace(',', '');
    const price = parseFloat(priceStr) || 0;

    try {
      await prisma.mealRecipe.create({
        data: {
          name: firstRow.dishName,
          display_name: firstRow.dishName,
          final_yield_weight: 1.0,
          pricing_override: price > 0 ? price : null,
          components: {
            create: components,
          },
        },
      });
      mealCount++;
      
      if (mealCount % 50 === 0) {
        console.log(`  Imported ${mealCount} / ${dishGroups.size} meals`);
      }
    } catch (err: any) {
      console.error(`Error creating meal ${dishId}:`, err.message);
    }
  }

  console.log(`✓ Imported ${mealCount} meals\n`);

  console.log('✅ Data import completed successfully!');
  console.log(`\nSummary:`);
  console.log(`  - ${ingredientMap.size} ingredients`);
  console.log(`  - ${subRecipeCount} sub-recipes`);
  console.log(`  - ${mealCount} meals`);
}

importData()
  .catch((e) => {
    console.error('Import error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
