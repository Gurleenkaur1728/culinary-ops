import { IsString, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class CreateMealSubRecipeDto {
  @IsString()
  subRecipeId: string;

  @IsOptional()
  @IsString()
  srName?: string;

  @IsOptional()
  @IsNumber()
  perPortion?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

export class CreateMealDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  backendUrl?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateMealSubRecipeDto)
  subRecipes?: CreateMealSubRecipeDto[];
}

export class UpdateMealDto extends PartialType(CreateMealDto) {}
