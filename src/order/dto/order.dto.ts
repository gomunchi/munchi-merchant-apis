import { Exclude, Expose, Type } from 'class-transformer';
import { CustomerDto } from './customer.dto';
import { ProductDto } from './product.dto';
import { SummaryDto } from './summary.dto';
import { HistoryDto } from './history.dto';
import { BusinessDto } from 'src/business/dto/business.dto';
import { OfferDto } from 'src/order/dto/offer.dto';
import { WoltOrderType } from 'src/provider/wolt/wolt.type';

class ReportingData {
  @Expose()
  at: Array<Record<string, string>>;

  constructor(data: Array<Record<string, string>>) {
    this.at = data;
  }
}

@Exclude()
export class OrderDto {
  @Expose()
  id: number;

  @Expose({ name: 'paymethod_id' })
  paymethodId: number;

  @Expose({ name: 'business_id' })
  businessId: number;

  @Expose({ name: 'customer_id' })
  customerId: number;

  @Expose()
  status: number;

  @Expose({ name: 'delivery_type' })
  deliveryType: number;

  @Expose({ name: 'delivery_datetime' })
  deliveryTime: number;

  @Expose({ name: 'prepared_in' })
  preparedIn: number;

  @Expose({ name: 'created_at' })
  createdAt: string;

  @Expose({ name: 'spot_number' })
  table: number;

  @Expose()
  @Type(() => SummaryDto)
  summary: SummaryDto[];

  @Expose()
  @Type(() => ProductDto)
  products: ProductDto[];

  @Expose()
  @Type(() => CustomerDto)
  customer: CustomerDto;

  @Expose()
  @Type(() => HistoryDto)
  history: HistoryDto[];

  @Expose()
  business: BusinessDto;

  @Expose()
  comment: string;

  @Expose()
  @Type(() => OfferDto)
  offers: OfferDto[];

  @Expose()
  reporting_data: ReportingData;

  constructor(partial: Partial<OrderDto>) {
    Object.assign(this, partial);
  }
}

export type OrderResponse = {
  id: string;
  provider: string;
  orderId: string;
  orderNumber: string;
  business: {
    publicId: string;
    name: string;
    logo: string | null;
    email: string;
    address: string;
  };
  type: WoltOrderType;
  status: string;
  deliveryType: number;
  createdAt: string;
  comment: string;
  preparedIn: string;
  preorder: {
    status: AvailableOrderResponsePreOrderStatusEnum;
    preorderTime: string;
  };
  table: number | null;
  products: ProductDto[];
  summary: {
    total: string;
  };
  deliveryEta: string | null;
  pickupEta: string | null;
  offers: OfferDto[];
  lastModified: string;
  customer: OrderResponseCustomer;
  payMethodId: number | null;
};

export enum OrderResponsePreOrderStatusEnum {
  Waiting = 'waiting',
  Confirm = 'confirmed',
}

export type AvailableOrderResponsePreOrderStatusEnum =
  | OrderResponsePreOrderStatusEnum.Confirm
  | OrderResponsePreOrderStatusEnum.Waiting;

export type OrderResponseCustomer = {
  name: string;
  phone: string;
};

export enum OrderStatusEnum {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  PREORDER = 'preorder',
  DRIVER_FOUND = 'driver_found',
  DELIVERED = 'delivered',
  PICK_UP_COMPLETED_BY_DRIVER = 'pick_up_completed_by_driver',
}

export type AvailableOrderStatus =
  | OrderStatusEnum.PENDING
  | OrderStatusEnum.IN_PROGRESS
  | OrderStatusEnum.REJECTED
  | OrderStatusEnum.COMPLETED
  | OrderStatusEnum.DELIVERED
  | OrderStatusEnum.PREORDER
  | OrderStatusEnum.DRIVER_FOUND
  | OrderStatusEnum.PICK_UP_COMPLETED_BY_DRIVER;
