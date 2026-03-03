import { IsString, IsOptional, IsDateString, IsInt, IsNumber } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateProductionPlanDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  weekLabel?: string;

  @IsOptional()
  @IsDateString()
  productionDate?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateProductionPlanDto extends PartialType(CreateProductionPlanDto) {}

export class UpsertPlanItemDto {
  @IsString()
  mealId: string;

  @IsInt()
  quantity: number;
}
