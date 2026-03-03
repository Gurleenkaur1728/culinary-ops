import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSRIngredientDto {
  @IsString()
  ingredientId: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  trimPct?: number;
}

export class CreateSubRecipeDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  station?: string;

  @IsOptional()
  @IsString()
  day?: string;

  @IsOptional()
  @IsNumber()
  priority?: number;

  @IsOptional()
  @IsString()
  prepInstructions?: string;

  @IsOptional()
  @IsString()
  backendUrl?: string;

  @IsOptional()
  @IsNumber()
  baseWeight?: number;

  @IsOptional()
  @IsString()
  baseUnit?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSRIngredientDto)
  ingredients?: CreateSRIngredientDto[];
}

export class UpdateSubRecipeDto extends PartialType(CreateSubRecipeDto) {}
