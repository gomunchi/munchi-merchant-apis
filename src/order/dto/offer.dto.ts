import { Exclude, Expose } from 'class-transformer';

enum OfferType {
  Offer = 1,
  Coupon = 2,
}

class SummaryData {
  @Expose()
  discount: number;

  constructor(data: number) {
    this.discount = data;
  }
}

@Exclude()
export class OfferDto {
  @Expose()
  name: string;

  @Expose()
  label: string;

  @Expose()
  type: OfferType;

  @Expose({ name: 'rate_type' })
  rateType: string;

  @Expose()
  rate: number;

  @Expose()
  summary: SummaryData;
}
