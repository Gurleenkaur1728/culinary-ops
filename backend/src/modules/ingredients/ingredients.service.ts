import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIngredientDto, UpdateIngredientDto } from './dto/ingredient.dto';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string, skip = 0, take = 50) {
    const where = search ? { name: { contains: search, mode: 'insensitive' as const } } : undefined;
    const [data, total] = await Promise.all([
      this.prisma.ingredient.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take,
      }),
      this.prisma.ingredient.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingredient not found');
    return ingredient;
  }

  async create(dto: CreateIngredientDto) {
    const existing = await this.prisma.ingredient.findUnique({ where: { id: dto.id } });
    if (existing) throw new ConflictException('Ingredient ID already exists');
    return this.prisma.ingredient.create({ data: { id: dto.id, name: dto.name } });
  }

  async update(id: string, dto: UpdateIngredientDto) {
    await this.findOne(id);
    return this.prisma.ingredient.update({ where: { id }, data: { name: dto.name } });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.ingredient.delete({ where: { id } });
    return { success: true };
  }
}
