import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionEngineService } from '../../services/production-engine.service';
import { CostEngineService } from '../../services/cost-engine.service';

@Module({
  controllers: [ProductionController],
  providers: [ProductionEngineService, CostEngineService],
  exports: [ProductionEngineService],
})
export class ProductionModule {}
