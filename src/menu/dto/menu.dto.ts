import { Exclude, Expose, Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export interface OrderingProductCategory {
  id: number;
  business_id: number;
  name: string;
  image: string | null;
  rank: number;
  enabled: boolean;
  external_id: string | null;
  parent_category_id: number | null;
  description: string | null;
}

export interface OrderingCategoryExtraOptionSubOption {
  id: number;
  extra_option_id: number;
  name: string;
  price: number;
  image: string | null;
  rank: number;
  description: string | null;
  enabled: boolean;
  external_id: string | null;
  preselected: boolean;
}

export class MenuQuery {
  @IsString()
  @IsNotEmpty()
  businessPublicId: string;
}

@Exclude()
export class MenuCategoryDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  enabled: boolean;

  @Expose()
  @Type(() => MenuProductDto)
  products: MenuProductDto[];
}

@Exclude()
export class MenuProductDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  images: string;

  @Expose()
  price: number;

  @Expose()
  enabled: boolean;

  @Expose({ name: 'category_id' })
  categoryId: number;
}

@Exclude()
export class MenuProductOptionDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  enabled: boolean;

  @Expose({ name: 'extra_id' })
  extraId: number;

  @Expose()
  @Type(() => MenuProductOptionSuboptionDto)
  suboptions: MenuProductOptionSuboptionDto[];
}

@Exclude()
export class MenuProductOptionSuboptionDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  enabled: boolean;

  @Expose({ name: 'extra_option_id' })
  extraOptionId: number;
}
