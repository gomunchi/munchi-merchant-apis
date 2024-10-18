import { FoodoraOrderStatus } from './foodora.enum.dto';

export interface UpdateFoodoraOrderStatusDto {
  acceptanceTime?: string;
  remoteOrderId?: string;
  status: FoodoraOrderStatus;
  message?: string;
  reason?: string;
}

export interface GetOrdersIdsResponse {
  orders: string[];
  count: number;
}
