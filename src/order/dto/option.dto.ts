import { Exclude, Expose, Type } from 'class-transformer';
import { SubOptionDto } from './suboption.dto';

@Exclude()
export class OptionDto {
  @Expose()
  id: string;
  @Expose()
  name: string;

  @Expose()
  image: string;

  @Expose()
  price: string;

  @Expose({ name: 'suboptions' })
  @Type(() => SubOptionDto)
  subOptions: SubOptionDto[];

  constructor(partial: Partial<OptionDto>) {
    Object.assign(this, partial);
  }
}
