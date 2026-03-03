import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private service: ReportsService) {}

  @Get('cooking')
  getCooking(@Query('planId') planId: string) {
    return this.service.getCookingReport(planId);
  }

  @Get('sub-recipes')
  getSubRecipes(@Query('planId') planId: string) {
    return this.service.getSubRecipeReport(planId);
  }

  @Get('shopping-list')
  getShoppingList(@Query('planId') planId: string) {
    return this.service.getShoppingList(planId);
  }

  @Get('cooking/export-csv')
  async exportCooking(@Query('planId') planId: string, @Res() res: Response) {
    const data = await this.service.getCookingReport(planId);
    const rows: string[] = ['Station,Sub-Recipe,Priority,Total Portions,Ingredient,Per Portion,Unit,Total Batch,Total Kgs'];
    for (const station of data) {
      for (const sr of station.subRecipes) {
        for (const ing of sr.ingredients) {
          rows.push(
            [station.station, sr.srName, sr.priority, sr.totalPortions, ing.ingredientName, ing.perPortion ?? '', ing.unit ?? '', ing.totalBatch, ing.totalKgs ?? '']
              .map(String)
              .map((v) => `"${v.replace(/"/g, '""')}"`)
              .join(','),
          );
        }
      }
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="cooking-report-${planId}.csv"`);
    res.send(rows.join('\n'));
  }

  @Get('shopping-list/export-csv')
  async exportShoppingList(@Query('planId') planId: string, @Res() res: Response) {
    const data = await this.service.getShoppingList(planId);
    const rows = ['Ingredient ID,Ingredient Name,Total Qty,Unit,Total Kgs'];
    for (const item of data) {
      rows.push(
        [item.ingredientId, item.ingredientName, item.totalQty, item.unit, item.totalKgs ?? '']
          .map(String)
          .map((v) => `"${v.replace(/"/g, '""')}"`)
          .join(','),
      );
    }
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="shopping-list-${planId}.csv"`);
    res.send(rows.join('\n'));
  }
}
