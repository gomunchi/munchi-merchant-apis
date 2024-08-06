import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class SummaryDto {
  @Expose()
  tax: number;

  @Expose()
  total: number;
  @Expose()
  discount: number;

  @Expose({ name: 'delivery_price' })
  deliveryPrice: number;

  @Expose({ name: 'delivery_price_with_discount' })
  deliveryPriceWithDiscount: number;

  @Expose({ name: 'service_fee' })
  serviceFee: number;

  @Expose({ name: 'subtotal' })
  subTotal: number;

  @Expose({ name: 'subtotal_with_discount' })
  subTotalWithDiscount: number;

  constructor(partial: Partial<SummaryDto>) {
    Object.assign(this, partial);
  }
}
