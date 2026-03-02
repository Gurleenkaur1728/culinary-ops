import { Module } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { IngredientsController } from './ingredients.controller';
import { CostEngineService } from '../../services/cost-engine.service';

@Module({
  controllers: [IngredientsController],
  providers: [IngredientsService, CostEngineService],
  exports: [IngredientsService],
})
export class IngredientsModule {}
