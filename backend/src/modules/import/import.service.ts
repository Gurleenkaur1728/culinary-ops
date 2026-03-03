import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  private parseCsv(buffer: Buffer): Promise<string[][]> {
    return new Promise((resolve, reject) => {
      const records: string[][] = [];
      const stream = Readable.from(buffer);
      stream
        .pipe(
          parse({
            relax_column_count: true,
            skip_empty_lines: true,
            trim: true,
          }),
        )
        .on('data', (row: string[]) => records.push(row))
        .on('error', reject)
        .on('end', () => resolve(records));
    });
  }

  async importSubRecipes(buffer: Buffer) {
    const rows = await this.parseCsv(buffer);
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    let currentSR: any = null;
    let currentIngredients: any[] = [];

    const saveCurrentSR = async () => {
      if (!currentSR) return;
      try {
        const existing = await this.prisma.subRecipe.findUnique({ where: { id: currentSR.id } });
        if (existing) {
          await this.prisma.subRecipe.update({
            where: { id: currentSR.id },
            data: {
              name: currentSR.name,
              station: currentSR.station || null,
              day: currentSR.day || null,
              priority: currentSR.priority ?? null,
              prepInstructions: currentSR.prepInstructions || null,
              backendUrl: currentSR.backendUrl || null,
              ingredients: {
                deleteMany: {},
                create: currentIngredients,
              },
            },
          });
          updated++;
        } else {
          await this.prisma.subRecipe.create({
            data: {
              id: currentSR.id,
              name: currentSR.name,
              station: currentSR.station || null,
              day: currentSR.day || null,
              priority: currentSR.priority ?? null,
              prepInstructions: currentSR.prepInstructions || null,
              backendUrl: currentSR.backendUrl || null,
              ingredients: { create: currentIngredients },
            },
          });
          created++;
        }
      } catch (e: any) {
        errors.push(`SR ${currentSR.id}: ${e.message}`);
      }
      currentSR = null;
      currentIngredients = [];
    };

    // Skip header row
    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      const srId = row[3]?.trim();
      const srName = row[5]?.trim();
      const ingId = row[6]?.trim();

      if (srId && srName) {
        // New sub-recipe header row
        await saveCurrentSR();
        const priorityStr = row[2]?.trim();
        currentSR = {
          id: srId,
          name: srName,
          station: row[0]?.trim() || null,
          day: row[1]?.trim() || null,
          priority: priorityStr ? parseInt(priorityStr) || null : null,
          backendUrl: row[4]?.trim() || null,
          prepInstructions: row[11]?.trim() || null,
        };
        currentIngredients = [];
      } else if (ingId && currentSR) {
        // Ingredient row
        const weightStr = row[9]?.trim();
        const trimStr = row[8]?.trim();

        // Upsert ingredient
        try {
          await this.prisma.ingredient.upsert({
            where: { id: ingId },
            create: { id: ingId, name: row[7]?.trim() || ingId },
            update: { name: row[7]?.trim() || ingId },
          });
          currentIngredients.push({
            ingredientId: ingId,
            weight: weightStr ? parseFloat(weightStr) || null : null,
            unit: row[10]?.trim() || null,
            trimPct: trimStr ? parseFloat(trimStr) || null : null,
          });
        } catch (e: any) {
          errors.push(`Ingredient ${ingId}: ${e.message}`);
        }
      }
    }

    // Save last SR
    await saveCurrentSR();

    return { created, updated, errors };
  }

  async importMeals(buffer: Buffer) {
    const rows = await this.parseCsv(buffer);
    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    let currentMeal: any = null;
    let currentSRLinks: any[] = [];

    const saveCurrentMeal = async () => {
      if (!currentMeal) return;
      try {
        const existing = await this.prisma.meal.findUnique({ where: { id: currentMeal.id } });
        if (existing) {
          await this.prisma.meal.update({
            where: { id: currentMeal.id },
            data: {
              name: currentMeal.name,
              category: currentMeal.category || null,
              price: currentMeal.price || null,
              backendUrl: currentMeal.backendUrl || null,
              subRecipes: {
                deleteMany: {},
                create: currentSRLinks,
              },
            },
          });
          updated++;
        } else {
          await this.prisma.meal.create({
            data: {
              id: currentMeal.id,
              name: currentMeal.name,
              category: currentMeal.category || null,
              price: currentMeal.price || null,
              backendUrl: currentMeal.backendUrl || null,
              subRecipes: { create: currentSRLinks },
            },
          });
          created++;
        }
      } catch (e: any) {
        errors.push(`Meal ${currentMeal.id}: ${e.message}`);
      }
      currentMeal = null;
      currentSRLinks = [];
    };

    const dataRows = rows.slice(1);

    for (const row of dataRows) {
      const dishId = row[0]?.trim();
      const dishName = row[3]?.trim();
      const srId = row[4]?.trim();

      if (dishId && dishName) {
        // New meal header row
        await saveCurrentMeal();
        currentMeal = {
          id: dishId,
          name: dishName,
          backendUrl: row[1]?.trim() || null,
          category: row[2]?.trim() || null,
          price: row[8]?.trim() || null,
        };
        currentSRLinks = [];
      } else if (srId && currentMeal) {
        // SR link row
        const perPortionStr = row[6]?.trim();
        // Make sure the sub-recipe exists (create placeholder if not)
        const srName = row[5]?.trim() || srId;
        try {
          await this.prisma.subRecipe.upsert({
            where: { id: srId },
            create: { id: srId, name: srName },
            update: {},
          });
          currentSRLinks.push({
            subRecipeId: srId,
            srName: srName,
            perPortion: perPortionStr ? parseFloat(perPortionStr) || null : null,
            unit: row[7]?.trim() || null,
          });
        } catch (e: any) {
          errors.push(`SR link ${srId} for meal ${currentMeal.id}: ${e.message}`);
        }
      }
    }

    await saveCurrentMeal();

    return { created, updated, errors };
  }
}
