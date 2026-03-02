import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CostEngineService } from '../../services/cost-engine.service';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(
    private prisma: PrismaService,
    private costEngine: CostEngineService,
  ) {}

  async findAll(category?: string) {
    return this.prisma.ingredient.findMany({
      where: category ? { category } : undefined,
      orderBy: { internal_name: 'asc' },
    });
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        sub_recipe_components: {
          include: { sub_recipe: { select: { id: true, name: true } } },
        },
        meal_components: {
          include: { meal: { select: { id: true, name: true } } },
        },
      },
    });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    return ingredient;
  }

  async create(dto: CreateIngredientDto) {
    const existing = await this.prisma.ingredient.findUnique({
      where: { sku: dto.sku },
    });
    if (existing) throw new ConflictException('SKU already exists');

    return this.prisma.ingredient.create({ data: dto });
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findOne(id);

    if (dto.sku) {
      const existing = await this.prisma.ingredient.findFirst({
        where: { sku: dto.sku, NOT: { id } },
      });
      if (existing) throw new ConflictException('SKU already in use');
    }

    const updated = await this.prisma.ingredient.update({
      where: { id },
      data: dto,
    });

    // Recalculate costs for all affected sub-recipes and meals
    if (dto.cost_per_unit !== undefined || dto.trim_percentage !== undefined) {
      await this.costEngine.recalculateForIngredient(id);
    }

    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.ingredient.delete({ where: { id } });
  }

  async getCategories() {
    const result = await this.prisma.ingredient.groupBy({
      by: ['category'],
      orderBy: { category: 'asc' },
    });
    return result.map((r) => r.category);
  }
}
