import {
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class SubRecipeComponentDto {
  @IsOptional()
  @IsUUID()
  ingredient_id?: string;

  @IsOptional()
  @IsUUID()
  child_sub_recipe_id?: string;

  @IsNumber()
  @Min(0)
  quantity: number;

  @IsString()
  unit: string;
}

export class CreateSubRecipeDto {
  @IsString()
  name: string;

  @IsString()
  sub_recipe_code: string;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsString()
  production_day?: string;

  @IsOptional()
  @IsString()
  station_tag?: string;

  @IsNumber()
  @Min(0)
  base_yield_weight: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubRecipeComponentDto)
  components?: SubRecipeComponentDto[];
}

export class UpdateSubRecipeDto extends PartialType(CreateSubRecipeDto) {
  sub_recipe_code?: string;
  components?: SubRecipeComponentDto[];
}
