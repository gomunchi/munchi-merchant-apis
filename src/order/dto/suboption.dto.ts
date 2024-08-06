import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SubOptionDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  image: string;
  @Expose()
  price: string;

  @Expose()
  position: number;

  @Expose()
  quantity: number;

  constructor(partial: Partial<SubOptionDto>) {
    Object.assign(this, partial);
  }
}
