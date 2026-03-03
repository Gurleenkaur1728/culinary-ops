import { IsString, IsOptional } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateIngredientDto {
  @IsString()
  id: string;

  @IsString()
  name: string;
}

export class UpdateIngredientDto extends PartialType(CreateIngredientDto) {}
