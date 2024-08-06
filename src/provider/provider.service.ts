import { Injectable } from '@nestjs/common';
import { Order } from 'ordering-api-sdk';
import { AvailableOrderStatus, OrderResponse } from 'src/order/dto/order.dto';
import { OrderData } from 'src/type';
import { OrderingOrder } from './ordering/ordering.type';
import { ProviderOrder } from './provider.type';

@Injectable()
export abstract class ProviderService {
  abstract getAllOrder(accessToken: string, id: string): Promise<any>;

  abstract getOrderById(accessToken: string, id: string): Promise<ProviderOrder>;

  //Need business ids here as we need to get order from multiple businesses at a time
  abstract getOrderByStatus(
    accessToken: string,
    status: AvailableOrderStatus[],
    businessIds: string[],
  ): Promise<OrderResponse[] | OrderingOrder[]>;

  abstract updateOrder(
    accessToken: string,
    orderId: string,
    orderData: OrderData,
  ): Promise<Order | OrderResponse>;

  abstract mapOrderToOrderResponse(order: ProviderOrder): Promise<OrderResponse>;
}
