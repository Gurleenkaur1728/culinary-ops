import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProductionPlanDto, UpdateProductionPlanDto, UpsertPlanItemDto } from './dto/production-plan.dto';

@Injectable()
export class ProductionPlansService {
  constructor(private prisma: PrismaService) {}

  private itemInclude = {
    items: {
      include: {
        meal: {
          select: { id: true, name: true, category: true, price: true },
        },
      },
      orderBy: { meal: { name: 'asc' as const } },
    },
  };

  async findAll() {
    return this.prisma.productionPlan.findMany({
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: this.itemInclude,
    });
    if (!plan) throw new NotFoundException('Production plan not found');
    return plan;
  }

  async create(dto: CreateProductionPlanDto) {
    return this.prisma.productionPlan.create({
      data: {
        name: dto.name,
        weekLabel: dto.weekLabel,
        productionDate: dto.productionDate ? new Date(dto.productionDate) : undefined,
        status: dto.status || 'draft',
        notes: dto.notes,
      },
      include: this.itemInclude,
    });
  }

  async update(id: string, dto: UpdateProductionPlanDto) {
    await this.findOne(id);
    return this.prisma.productionPlan.update({
      where: { id },
      data: {
        name: dto.name,
        weekLabel: dto.weekLabel,
        productionDate: dto.productionDate ? new Date(dto.productionDate) : undefined,
        status: dto.status,
        notes: dto.notes,
      },
      include: this.itemInclude,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.productionPlan.delete({ where: { id } });
    return { success: true };
  }

  async duplicate(id: string) {
    const original = await this.findOne(id);
    return this.prisma.productionPlan.create({
      data: {
        name: `${original.name} (Copy)`,
        weekLabel: original.weekLabel,
        productionDate: original.productionDate,
        status: 'draft',
        notes: original.notes,
        items: {
          create: original.items.map((item) => ({
            mealId: item.mealId,
            quantity: item.quantity,
          })),
        },
      },
      include: this.itemInclude,
    });
  }

  async upsertItem(planId: string, dto: UpsertPlanItemDto) {
    await this.findOne(planId);
    if (dto.quantity <= 0) {
      await this.prisma.productionPlanItem.deleteMany({
        where: { planId, mealId: dto.mealId },
      });
      return { success: true };
    }
    return this.prisma.productionPlanItem.upsert({
      where: { planId_mealId: { planId, mealId: dto.mealId } },
      create: { planId, mealId: dto.mealId, quantity: dto.quantity },
      update: { quantity: dto.quantity },
      include: { meal: { select: { id: true, name: true, category: true, price: true } } },
    });
  }

  async removeItem(planId: string, mealId: string) {
    await this.prisma.productionPlanItem.deleteMany({ where: { planId, mealId } });
    return { success: true };
  }
}
