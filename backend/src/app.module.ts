import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { IngredientsModule } from './modules/ingredients/ingredients.module';
import { SubRecipesModule } from './modules/sub-recipes/sub-recipes.module';
import { MealsModule } from './modules/meals/meals.module';
import { OrdersModule } from './modules/orders/orders.module';
import { ProductionModule } from './modules/production/production.module';
import { ShopifyWebhookController } from './webhooks/shopify.controller';
import { CostEngineService } from './services/cost-engine.service';
import { ProductionEngineService } from './services/production-engine.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    IngredientsModule,
    SubRecipesModule,
    MealsModule,
    OrdersModule,
    ProductionModule,
  ],
  controllers: [ShopifyWebhookController],
  providers: [CostEngineService, ProductionEngineService],
})
export class AppModule {}
