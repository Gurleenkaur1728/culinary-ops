import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class MealComponentDto {
  @IsOptional()
  @IsUUID()
  ingredient_id?: string;

  @IsOptional()
  @IsUUID()
  sub_recipe_id?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;
}

export class CreateMealDto {
  @IsString()
  name: string;

  @IsString()
  display_name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  final_yield_weight?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricing_override?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allergen_tags?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dislikes?: string[];

  @IsOptional()
  @IsString()
  heating_instructions?: string;

  @IsOptional()
  @IsString()
  packaging_instructions?: string;

  @IsOptional()
  @IsString()
  cooking_instructions?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MealComponentDto)
  components?: MealComponentDto[];
}

export class UpdateMealDto extends PartialType(CreateMealDto) {
  components?: MealComponentDto[];
}
