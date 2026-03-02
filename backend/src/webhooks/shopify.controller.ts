import {
  Controller,
  Post,
  Headers,
  Body,
  HttpCode,
  Logger,
  BadRequestException,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { ProductionEngineService } from '../services/production-engine.service';

interface ShopifyLineItem {
  id: number;
  sku: string;
  quantity: number;
  name: string;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  line_items: ShopifyLineItem[];
  created_at: string;
  note_attributes?: { name: string; value: string }[];
}

@Controller('webhooks/shopify')
export class ShopifyWebhookController {
  private readonly logger = new Logger(ShopifyWebhookController.name);

  constructor(
    private prisma: PrismaService,
    private productionEngine: ProductionEngineService,
    private configService: ConfigService,
  ) {}

  @Post('orders')
  @HttpCode(200)
  async handleOrderCreated(
    @Headers('x-shopify-hmac-sha256') hmacHeader: string,
    @Headers('x-shopify-topic') topic: string,
    @Body() body: ShopifyOrder,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Validate HMAC signature
    const secret = this.configService.get<string>('SHOPIFY_WEBHOOK_SECRET');
    if (secret) {
      const rawBody = req.rawBody;
      if (!rawBody) {
        this.logger.warn('Raw body not available for HMAC validation');
      } else {
        const isValid = this.validateShopifyWebhook(rawBody, hmacHeader, secret);
        if (!isValid) {
          this.logger.warn(`Invalid Shopify webhook signature for order ${body?.order_number}`);
          throw new BadRequestException('Invalid webhook signature');
        }
      }
    }

    this.logger.log(`Processing Shopify order: #${body.order_number} (topic: ${topic})`);

    const results = await this.processShopifyOrder(body);

    this.logger.log(
      `Processed ${results.created} orders, skipped ${results.skipped} duplicates`,
    );

    return { received: true, processed: results.created, skipped: results.skipped };
  }

  private async processShopifyOrder(shopifyOrder: ShopifyOrder) {
    let created = 0;
    let skipped = 0;

    // Extract production date from order notes or default to tomorrow
    const productionDate = this.extractProductionDate(shopifyOrder);

    for (const lineItem of shopifyOrder.line_items) {
      if (!lineItem.sku) {
        this.logger.warn(
          `Line item ${lineItem.id} in order #${shopifyOrder.order_number} has no SKU — skipping`,
        );
        skipped++;
        continue;
      }

      // Find the meal recipe by SKU (we treat Shopify SKU as meal internal name or SKU match)
      const meal = await this.prisma.mealRecipe.findFirst({
        where: { name: lineItem.sku },
      });

      if (!meal) {
        this.logger.warn(
          `No meal found for SKU "${lineItem.sku}" in order #${shopifyOrder.order_number}`,
        );
        skipped++;
        continue;
      }

      const externalOrderId = `shopify-${shopifyOrder.id}-${lineItem.id}`;

      const existing = await this.prisma.order.findUnique({
        where: { external_order_id: externalOrderId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      await this.prisma.order.create({
        data: {
          external_order_id: externalOrderId,
          meal_id: meal.id,
          quantity: lineItem.quantity,
          production_date: productionDate,
          source_platform: 'shopify',
        },
      });

      created++;
    }

    return { created, skipped };
  }

  private extractProductionDate(order: ShopifyOrder): Date {
    const noteAttr = order.note_attributes?.find(
      (a) => a.name === 'production_date',
    );

    if (noteAttr?.value) {
      const parsed = new Date(noteAttr.value);
      if (!isNaN(parsed.getTime())) return parsed;
    }

    // Default: next day
    const tomorrow = new Date(order.created_at);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  private validateShopifyWebhook(
    rawBody: Buffer,
    hmacHeader: string,
    secret: string,
  ): boolean {
    try {
      const computed = createHmac('sha256', secret)
        .update(rawBody)
        .digest('base64');
      const headerBuf = Buffer.from(hmacHeader ?? '', 'base64');
      const computedBuf = Buffer.from(computed, 'base64');

      if (headerBuf.length !== computedBuf.length) return false;
      return timingSafeEqual(headerBuf, computedBuf);
    } catch {
      return false;
    }
  }
}
