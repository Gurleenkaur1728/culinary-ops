import { Module } from '@nestjs/common';
import { MealsService } from './meals.service';
import { MealsController } from './meals.controller';
import { CostEngineService } from '../../services/cost-engine.service';

@Module({
  controllers: [MealsController],
  providers: [MealsService, CostEngineService],
  exports: [MealsService],
})
export class MealsModule {}
