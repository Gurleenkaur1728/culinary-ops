import { Module } from '@nestjs/common';
import { SubRecipesController } from './sub-recipes.controller';
import { SubRecipesService } from './sub-recipes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubRecipesController],
  providers: [SubRecipesService],
  exports: [SubRecipesService],
})
export class SubRecipesModule {}
