import { FoodoraOrder } from './foodora/dto/foodora-order-response.dto';
import { OrderingOrder } from './ordering/dto/ordering-order.dto';
import { WoltOrderV2 } from './wolt/dto/wolt-order-v2.dto';
import { WoltOrder } from './wolt/dto/wolt-order.dto';

/**
 * This wolt actions take from wolt develop document to make it dynamic
 *
 * Reference: https://developer.wolt.com/docs/api/order
 */
export type WOLT_ACTIONS =
  | 'accept'
  | 'reject'
  | 'ready'
  | 'delivered'
  | 'confirm-preorder'
  | 'replace-items';

export enum ProviderEnum {
  Wolt = 'Wolt',
  Munchi = 'Munchi',
  Foodora = 'Foodora',
}

export type AvailableProvider = ProviderEnum.Wolt | ProviderEnum.Munchi | ProviderEnum.Foodora;

export type ProviderOrder = OrderingOrder | WoltOrder | WoltOrderV2 | FoodoraOrder;
