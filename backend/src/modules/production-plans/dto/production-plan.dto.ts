import { IsString, IsOptional, IsArray, ValidateNested, IsInt, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class PlanItemDto {
  @IsUUID()
  meal_id: string;

  @IsInt()
  @Min(0)
  quantity: number;
}

export class CreateProductionPlanDto {
  @IsString()
  week_label: string;

  @IsString()
  week_start: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PlanItemDto)
  items?: PlanItemDto[];
}

export class UpdateProductionPlanDto extends PartialType(CreateProductionPlanDto) {}
