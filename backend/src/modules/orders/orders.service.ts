import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderDto } from './dto/order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(startDate?: string, endDate?: string) {
    return this.prisma.order.findMany({
      where: {
        production_date:
          startDate || endDate
            ? {
                gte: startDate ? new Date(startDate) : undefined,
                lte: endDate ? new Date(endDate) : undefined,
              }
            : undefined,
      },
      include: {
        meal: { select: { id: true, name: true, display_name: true } },
      },
      orderBy: { production_date: 'asc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        meal: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async create(dto: CreateOrderDto) {
    const existing = await this.prisma.order.findUnique({
      where: { external_order_id: dto.external_order_id },
    });
    if (existing) throw new ConflictException('Order with this external ID already exists');

    return this.prisma.order.create({
      data: {
        external_order_id: dto.external_order_id,
        meal_id: dto.meal_id,
        quantity: dto.quantity,
        production_date: new Date(dto.production_date),
        source_platform: dto.source_platform ?? 'shopify',
      },
      include: {
        meal: { select: { id: true, name: true, display_name: true } },
      },
    });
  }

  async update(id: string, dto: UpdateOrderDto) {
    await this.findOne(id);
    return this.prisma.order.update({
      where: { id },
      data: {
        ...dto,
        production_date: dto.production_date ? new Date(dto.production_date) : undefined,
      },
      include: {
        meal: { select: { id: true, name: true, display_name: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.order.delete({ where: { id } });
  }

  async bulkCreate(orders: CreateOrderDto[]) {
    const results = await this.prisma.$transaction(
      orders.map((dto) =>
        this.prisma.order.upsert({
          where: { external_order_id: dto.external_order_id },
          create: {
            external_order_id: dto.external_order_id,
            meal_id: dto.meal_id,
            quantity: dto.quantity,
            production_date: new Date(dto.production_date),
            source_platform: dto.source_platform ?? 'shopify',
          },
          update: {
            quantity: dto.quantity,
            production_date: new Date(dto.production_date),
          },
        }),
      ),
    );
    return results;
  }
}
