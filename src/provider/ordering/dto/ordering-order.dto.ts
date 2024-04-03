import { Business, Order } from 'ordering-api-sdk';

type Lapse = {
  open: {
    hour: number;
    minute: number;
  };
  close: {
    hour: number;
    minute: number;
  };
};

export type Schedule = {
  enabled: boolean;
  lapses: Lapse[];
};

interface OrderingOrderSummary {
  total: number;
  discount: number;
  subtotal: number;
  subtotal_with_discount: number;
  service_fee_rate: number | null;
  service_fee: number;
  service_fee_with_discount: number;
  delivery_price: number;
  delivery_price_with_discount: number;
  tax_rate: number;
  tax: number;
  tax_after_discount: number;
  tax_with_discount: number;
  driver_tip: number;
  driver_tip_rate: number;
}

interface OrderingOrderReportingData {
  at: {
    created: string;
    [status: string]: string;
  };
}

interface OrderingOrderProductOptionSuboption {
  id: number;
  order_product_option_id: number;
  extra_option_suboption_id: number;
  name: string;
  image: string | null;
  price: number;
  half_price: number | null;
  position: string;
  quantity: number;
  external_id: string | null;
}

interface OrderingOrderProductOption {
  id: number;
  order_product_id: number;
  extra_option_id: number;
  name: string;
  image: string | null;
  allow_suboption_quantity: boolean;
  with_half_option: boolean;
  limit_suboptions_by_max: boolean;
  external_id: string | null;
  suboptions: OrderingOrderProductOptionSuboption[];
}

interface Offer {
  id: number;
  order_id: number;
  offer_id: number;
  name: string;
  description: string;
  image: null | string;
  label: null | string;
  type: number;
  rate: number;
  rate_type: number;
  condition_type: number;
  target: number;
  coupon: null | string;
  auto: boolean;
  public: boolean;
  stackable: boolean;
  created_at: null | string;
  updated_at: null | string;
  reference_id: null | string;
  rank: null | string;
  discounts: {
    [key: string]: {
      [key: string]: number;
    };
  };
  summary: {
    discount: number;
  };
}

interface OrderingOrderProduct {
  id: number;
  product_id: number;
  order_id: number;
  name: string;
  price: number;
  quantity: number;
  comment: string | null;
  ingredients: Array<any>;
  options: OrderingOrderProductOption[];
  featured: boolean;
  upselling: boolean;
  in_offer: boolean;
  offer_price: number | null;
  images: string;
  offer_rate: number;
  offer_rate_type: number;
  offer_include_options: boolean;
  status: number;
  priority: number;
  reporting_data: string | null;
  fee_id: number | null;
  tax_id: number | null;
  summary: OrderingOrderSummary;
  code: string;
}

export interface OrderingCustomer {
  id: number;
  order_id: number;
  name: string;
  photo: string | null;
  lastname: string;
  email: string;
  dropdown_option_id: number | null;
  address: string;
  address_notes: string;
  zipcode: string;
  cellphone: string;
  phone: string | null;
  location: {
    lat: number;
    lng: number;
  };
  internal_number: string;
  map_data: {
    library: string;
    place_id: string;
  };
  tag: string;
  middle_name: string | null;
  second_lastname: string | null;
  country_phone_code: string;
  external_id: string | null;
  dropdown_option: string | null;
}

export interface OrderingOrder extends Order {
  reporting_data: OrderingOrderReportingData;
  prepared_in: string;
  summary: OrderingOrderSummary;
  products: OrderingOrderProduct[];
  customer: OrderingCustomer;
  business: Business;
  offers: Offer[];
  history: any;
  spot_number: number | null;
}

export enum OrderingPaymentEnum {
  Cash = 1,
}
