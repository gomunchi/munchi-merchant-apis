import { Injectable } from '@nestjs/common';
import { AvailableOrderStatus, OrderResponse } from 'src/order/dto/order.dto';
import { OrderData } from 'src/type';

import { ProviderOrder } from './provider.type';
import { OrderingOrder } from './ordering/dto/ordering-order.dto';
import { Provider } from '@prisma/client';

@Injectable()
export abstract class ProviderService {
  abstract getOrderById(credentials: string, id: string): Promise<ProviderOrder>;

  //Need business ids here as we need to get order from multiple businesses at a time
  abstract getOrderByStatus(
    accessToken: string,
    status: AvailableOrderStatus[],
    businessIds: string[],
  ): Promise<OrderResponse[] | OrderingOrder[]>;

  abstract updateOrder(
    orderingUserId: number,
    orderId: string,
    orderData: Omit<OrderData, 'provider'>,
    providerInfor?: Provider,
  ): Promise<OrderingOrder | OrderResponse>;

  abstract rejectOrder(
    orderingUserId: number,
    orderId: string,
    orderRejectData: {
      reason: string;
    },
    providerInfor?: Provider,
  ): Promise<OrderingOrder | OrderResponse>;
}
