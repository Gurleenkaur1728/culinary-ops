import { Module } from '@nestjs/common';
import { SubRecipesService } from './sub-recipes.service';
import { SubRecipesController } from './sub-recipes.controller';
import { CostEngineService } from '../../services/cost-engine.service';

@Module({
  controllers: [SubRecipesController],
  providers: [SubRecipesService, CostEngineService],
  exports: [SubRecipesService],
})
export class SubRecipesModule {}
