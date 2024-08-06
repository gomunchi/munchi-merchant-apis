import { Expose, Type } from 'class-transformer';
import { Business, Order } from 'ordering-api-sdk';

export enum OrderingOrderStatus {
  Pending = 0,
  Completed = 1,
  Rejected = 2,
  DriverInBusiness = 3,
  PreparationCompleted = 4,
  RejectedByBusiness = 5,
  CanceledByDriver = 6,
  AcceptedByBusiness = 7,
  AcceptedByDriver = 8,
  PickUpCompletedByDriver = 9,
  PickUpFailedByDriver = 10,
  DeliveryCompletedByDriver = 11,
  DeliveryFailedByDriver = 12,
  Preorder = 13,
  OrderNotReady = 14,
  PickupCompletedByCustomer = 15,
  CanceledByCustomer = 16,
  NotPickedByCustomer = 17,
  DriverAlmostArrivedToBusiness = 18,
  DriverAlmostArrivedToCustomer = 19,
  CustomerAlmostArrivedToBusiness = 20,
  CustomerArrivedToBusiness = 21,
  LookingForDriver = 22,
  DriverOnWay = 23,
  DriverWaitingForOrder = 24,
  AcceptedByDriverCompany = 25,
}

export const preorderStatus = [OrderingOrderStatus.Preorder];
export const pendingStatus = [OrderingOrderStatus.Pending, OrderingOrderStatus.Preorder];
export const inProgressStatus = [
  OrderingOrderStatus.AcceptedByBusiness,
  OrderingOrderStatus.AcceptedByDriver,
  // OrderingOrderStatus.DriverAlmostArrivedToBusiness,
  // OrderingOrderStatus.DriverAlmostArrivedToCustomer,
  // OrderingOrderStatus.CustomerAlmostArrivedToBusiness,
  // OrderingOrderStatus.DriverOnWay,
  // OrderingOrderStatus.LookingForDriver,
  // OrderingOrderStatus.OrderNotReady,
];
export const completedStatus = [
  // OrderingOrderStatus.Completed,
  OrderingOrderStatus.PreparationCompleted,
  // OrderingOrderStatus.DeliveryCompletedByDriver,
  // OrderingOrderStatus.PickupCompletedByCustomer,
];

export const rejectedStatus = [
  OrderingOrderStatus.Rejected,
  OrderingOrderStatus.RejectedByBusiness,
  OrderingOrderStatus.CanceledByDriver,
  OrderingOrderStatus.CanceledByCustomer,
  OrderingOrderStatus.NotPickedByCustomer,
  OrderingOrderStatus.DeliveryFailedByDriver,
];

export const deliveredStatus = [
  OrderingOrderStatus.PickUpCompletedByDriver,
  OrderingOrderStatus.PickupCompletedByCustomer,
];

export enum OrderingDeliveryType {
  Delivery = 1,
  PickUp = 2,
  EatIn = 3,
  Curbside = 4,
  DriverThru = 5,
}

export interface Address {
  lat: number;
  lng: number;
}

class Session {
  @Expose()
  access_token: string;

  @Expose()
  token_type: string;

  @Expose()
  expires_in: number;
}

export class OrderingBusiness {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  slug: string;

  @Expose()
  email: string;

  @Expose()
  address: string;

  @Expose()
  phone: string;

  @Expose()
  description: string;

  @Expose()
  logo: string;

  @Expose()
  header: string;

  // @Expose()
  // phone: string;

  // @Expose()
  // cellphone: string;
  // login_type: number;
  // social_id: string | null;
  // photo: string | null;
  // birthdate: string | null;
  // phone: string;
  // cellphone: string;
  // city_id: number;
  // dropdown_option_id: number;
  // address: string;
  // address_notes: string;
  // zipcode: string;
  // location: Address;

  @Expose()
  timezone: string;

  @Expose()
  today: number;

  @Expose()
  enabled: boolean;

  @Expose()
  open: boolean;
  //push_notifications: boolean;
  //busy: boolean;
  //available: boolean;
  //enabled: boolean;
  // created_at: string;
  // updated_at: string;
  // deleted_at: string | null;

  owners: OrderingUser[];
}

export class OrderingUser {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  lastname: string;

  @Expose()
  email: string;
  // login_type: number;
  // social_id: string | null;
  // photo: string | null;
  // birthdate: string | null;
  // phone: string;
  // cellphone: string;
  // city_id: number;
  // dropdown_option_id: number;
  // address: string;
  // address_notes: string;
  // zipcode: string;
  // location: Address;

  @Expose()
  level: number;

  @Expose()
  language_id: number;
  //push_notifications: boolean;
  //busy: boolean;
  //available: boolean;
  //enabled: boolean;
  // created_at: string;
  // updated_at: string;
  // deleted_at: string | null;

  @Expose()
  @Type(() => Session)
  session: Session;
  //dropdown_option: any | null;
}

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
