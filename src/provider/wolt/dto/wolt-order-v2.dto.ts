import { WoltOrderType } from './wolt-order.dto';

export interface WoltPriceBreakdownV2 {
  total_before_discounts: WoltPriceV2;
  total_discounts: WoltPriceV2;
}

export interface WoltPriceV2 {
  amount: number;
  currency: string;
}

export interface WoltItemPriceV2 {
  unit_price: WoltPriceV2;
  total: WoltPriceV2;
  price_breakdown: WoltPriceBreakdownV2;
}

export interface WoltOptionV2 {
  id: string;
  name: string;
  value: string;
  price: WoltPriceV2;
  pos_id: string;
  count: number;
  value_pos_id: string;
  deposit?: any;
}

export interface WoltItemV2 {
  item_type: string;
  id: string;
  count: number;
  pos_id: string;
  sku?: string;
  gtin?: string;
  options: WoltOptionV2[];
  item_price: WoltItemPriceV2;
  name: string;
  category: {
    id: string;
    name: string;
  };
  deposit?: any;
  is_bundle_offer: boolean;
}

export interface WoltDeliveryV2 {
  status: string;
  type: string;
  time?: string;
  location?: any;
  self_delivery: boolean;
}

export interface WoltFeePriceBreakDownv2 extends WoltPriceBreakdownV2 {
  liability: WoltPriceV2;
}

export interface WoltFeesV2 {
  total: WoltPriceV2;
  price_breakdown: WoltFeePriceBreakDownv2;
  parts: any[];
}

export interface WoltBasketPriceV2 {
  total: WoltPriceV2;
  price_breakdown: WoltPriceBreakdownV2;
}

export interface WoltOrderV2 {
  id: string;
  venue: {
    id: string;
    name: string;
    external_venue_id: string | null;
  };
  basket_price: WoltBasketPriceV2;
  delivery: WoltDeliveryV2;
  fees: WoltFeesV2;
  items: WoltItemV2[];
  created_at: string;
  consumer_comment: string | null;
  consumer_name: string;
  consumer_phone_number: string | null;
  pickup_eta: string;
  attribution_id: string | null;
  type: WoltOrderType;
  pre_order: any | null;
  order_number: string;
  order_status: string;
  modified_at: string;
  company_tax_id: string | null;
  loyalty_card_number: string | null;
  cash_payment: any | null;
}
