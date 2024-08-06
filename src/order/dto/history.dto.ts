import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class HistoryDto {
  @Expose()
  id: number;

  @Expose({ name: 'order_id' })
  orderId: number;

  @Expose()
  type: number;

  @Expose()
  // eslint-disable-next-line @typescript-eslint/ban-types
  data: Array<Object>;

  @Expose({ name: 'created_at' })
  createdAt: string;

  @Expose({ name: 'updated_at' })
  updatedAt: string;

  constructor(partial: Partial<HistoryDto>) {
    Object.assign(this, partial);
  }
}
