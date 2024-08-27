import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { OptionDto } from './option.dto';

@Exclude()
export class ProductDto {
  @Expose({ name: 'product_id' })
  @Transform(({ value }) => {
    return !value ? `generated-${Math.random().toString(36).substr(2, 9)}` : value.toString();
  })
  id: string;

  @Expose()
  name: string;

  @Expose()
  quantity: number;

  @Expose({ name: 'price' })
  @Transform(({ value }) => {
    return value.toString();
  })
  price: string;

  @Expose()
  comment: string;

  @Expose()
  @Type(() => OptionDto)
  options: OptionDto[];

  constructor(partial: Partial<ProductDto>) {
    Object.assign(this, partial);
  }
}
