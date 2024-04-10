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
