import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateIngredientDto {
  @IsString()
  internal_name: string;

  @IsString()
  display_name: string;

  @IsString()
  sku: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  supplier_name?: string;

  @IsNumber()
  @Min(0)
  trim_percentage: number;

  @IsNumber()
  @Min(0)
  base_weight: number;

  @IsNumber()
  @Min(0)
  cost_per_unit: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergen_tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}

// ── Bulk stock update ─────────────────────────────────────────────────────

export class StockUpdateItemDto {
  @IsUUID()
  id: string;

  @IsNumber()
  @Min(0)
  stock: number;
}

export class UpdateStockBulkDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockUpdateItemDto)
  updates: StockUpdateItemDto[];
}
