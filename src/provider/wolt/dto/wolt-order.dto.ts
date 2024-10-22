import { Prisma } from '@prisma/client';
import { AvailableOrderResponsePreOrderStatusEnum } from 'src/order/dto/order.dto';

export interface WoltCoordinate {
  lon: number;
  lat: number;
}

export interface WoltDeliveryLocation {
  street_address: string;
  apartment: string;
  city: string;
  country: string;
  coordinates: WoltCoordinate;
  formatted_address: string;
}

export interface WoltDeliveryFee {
  amount: number;
  currency: string;
}

export interface WoltSmallOrderSurcharge {
  amount: number;
  currency: string;
}

export type WoltDeliveryType = 'takeaway' | 'homedelivery' | 'eatin';

export enum WoltOrderStatusEnum {
  Received = 'received',
  Fetched = 'fetched',
  Acknowledged = 'acknowledged',
  Production = 'production',
  Ready = 'ready',
  Delivered = 'delivered',
  Rejected = 'rejected',
  Refunded = 'refunded',
}

export type AvailableWoltOrderStatus =
  | WoltOrderStatusEnum.Ready
  | WoltOrderStatusEnum.Fetched
  | WoltOrderStatusEnum.Acknowledged
  | WoltOrderStatusEnum.Production
  | WoltOrderStatusEnum.Ready
  | WoltOrderStatusEnum.Delivered
  | WoltOrderStatusEnum.Rejected
  | WoltOrderStatusEnum.Refunded;

export interface WoltDeliveryDetails {
  status: string;
  type: WoltDeliveryType;
  time: string;
  fee: WoltDeliveryFee;
  location: WoltDeliveryLocation;
  small_order_surcharge: WoltSmallOrderSurcharge;
}

export interface WoltPrice {
  amount: number;
  currency: string;
}

export interface WoltCategory {
  id: string;
  name: string;
}

export interface WoltSubstitutionSettings {
  is_allowed: boolean;
}

export interface WoltWeightDetails {
  weight_in_grams: number;
  requested_amount: number;
  extra_weight_percentage: number;
}

export interface WoltItem {
  id: string;
  name: string;
  count: number;
  options: WoltOption[];
  category: WoltCategory;
  row_number: number;
  substitution_settings: WoltSubstitutionSettings;
  total_price: WoltPrice;
  unit_price: WoltPrice;
  base_price: WoltPrice;
  weight_details: WoltWeightDetails;
  sku: string;
  gtin: string;
  pos_id: string;
  item_type: string;
}

export interface WoltOption {
  id: string;
  name: string;
  value: string;
  price: WoltPrice;
  pos_id: string;
  count: number;
  value_pos_id: string;
}

export interface WoltPreOrder {
  preorder_time: string;
  pre_order_status: AvailableOrderResponsePreOrderStatusEnum;
}

export enum WoltOrderType {
  Instant = 'instant',
  PreOrder = 'preorder',
}

export interface WoltOrder {
  id: string;
  venue: {
    id: string;
    name: string;
  };
  price: WoltPrice;
  delivery: WoltDeliveryDetails;
  items: WoltItem[];
  created_at: string;
  consumer_comment: string;
  pickup_eta: string;
  attribution_id: string;
  type: WoltOrderType;
  pre_order: WoltPreOrder;
  consumer_name: string;
  consumer_phone_number: string;
  order_number: string;
  order_status: AvailableWoltOrderStatus;
  modified_at: string;
  company_tax_id: string;
  loyalty_card_number: string;
}

export interface WoltOrderNotification {
  id: string;
  type: string;
  order: {
    id: string;
    venue_id: string;
    status: string;
    resource_url: string;
  };
  created_at: string;
}

export const WoltOrderPrismaSelectArgs = Prisma.validator<Prisma.OrderInclude>()({
  business: {
    select: {
      publicId: true,
      name: true,
      logo: true,
      email: true,
      phone: true,
      description: true,
      timeZone: true,
      address: true,
    },
  },
  customer: {
    select: {
      name: true,
      phone: true,
    },
  },
  offers: true,
  preorder: {
    select: {
      preorderTime: true,
      status: true,
    },
  },
  products: {
    select: {
      productId: true,
      comment: true,
      name: true,
      options: {
        select: {
          optionId: true,
          image: true,
          price: true,
          name: true,
          subOptions: {
            select: {
              subOptionId: true,
              name: true,
              image: true,
              price: true,
              position: true,
              quantity: true,
            },
          },
        },
      },
      price: true,
      quantity: true,
    },
  },
  summary: {
    select: {
      total: true,
    },
  },
});
