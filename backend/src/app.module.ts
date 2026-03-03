import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { SubRecipesModule } from './modules/sub-recipes/sub-recipes.module';
import { MealsModule } from './modules/meals/meals.module';
import { ProductionPlansModule } from './modules/production-plans/production-plans.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ImportModule } from './modules/import/import.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    IngredientsModule,
    SubRecipesModule,
    MealsModule,
    ProductionPlansModule,
    ReportsModule,
    ImportModule,
  ],
})
export class AppModule {}
