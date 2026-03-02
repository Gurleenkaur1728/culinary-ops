import { IsString, IsNumber, IsDateString, IsOptional, IsUUID, Min } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateOrderDto {
  @IsString()
  external_order_id: string;

  @IsUUID()
  meal_id: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsDateString()
  production_date: string;

  @IsOptional()
  @IsString()
  source_platform?: string;
}

export class UpdateOrderDto extends PartialType(CreateOrderDto) {
  production_date?: string;
}
