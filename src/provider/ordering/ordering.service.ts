import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { Business } from 'ordering-api-sdk';
import { AvailableOrderStatus, OrderStatusEnum } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthCredentials, OrderData } from 'src/type';
import { UtilsService } from 'src/utils/utils.service';
import { ProviderService } from '../provider.service';
import { OrderingOrderMapperService } from './ordering-order-mapper';
import { OrderingSyncService } from './ordering-sync';
import {
  OrderingDeliveryType,
  OrderingOrder,
  OrderingOrderStatus,
  OrderingUser,
} from './ordering.type';

@Injectable()
export class OrderingService implements ProviderService {
  private readonly logger = new Logger(OrderingService.name);

  constructor(
    private utilService: UtilsService,
    private readonly prismaService: PrismaService,
    private readonly orderingOrderMapperService: OrderingOrderMapperService,
    private readonly orderingSyncService: OrderingSyncService,
  ) {}

  async getOrderByStatus(
    accessToken: string,
    status: AvailableOrderStatus[],
    businessOrderingIds: string[],
  ): Promise<OrderingOrder[]> {
    //Map from order status to ordering stus
    const orderStatus = this.orderingOrderMapperService.mapOrderingStatusToOrderStatus(
      undefined,
      status,
    ) as number[];

    // Convert order status from number array to a string
    const mappedOrderStatusString = orderStatus.map((el: number) => el.toString()).join(',');
    const businessOrderingIdsString = businessOrderingIds.join(',');

    const paramsQuery = [
      'id',
      'business_id',
      'prepared_in',
      'customer_id',
      'status',
      'delivery_type',
      'delivery_datetime',
      'products',
      'summary',
      'customer',
      'created_at',
      'spot_number',
      'history',
      'delivery_datetime',
      'business',
      'reporting_data',
      'comment',
      'offers',
      'paymethod_id',
    ].join(',');

    const options = {
      method: 'GET',
      url: `${this.utilService.getEnvUrl(
        'orders',
      )}?mode=dashboard&where={"status":[${mappedOrderStatusString}],"business_id":[${businessOrderingIdsString}]}&params=${paramsQuery}`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);

      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async getOrderById(
    orderingAccessToken: string,
    orderId: string,
    apiKey?: string,
  ): Promise<OrderingOrder> {
    const options = {
      method: 'GET',
      url: `${this.utilService.getEnvUrl('orders', orderId)}?mode=dashboard`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
    };

    if (apiKey) {
      options.headers['x-api-key'] = apiKey;
    }

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  // Auth service
  async signIn(credentials: AuthCredentials): Promise<OrderingUser> {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl('auth'),
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
      },
      data: {
        email: credentials.email,
        password: credentials.password,
      },
    };

    try {
      const response = await axios.request(options);
      return plainToInstance(OrderingUser, response.data.result);
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async signOut(accessToken: string) {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl('auth', 'logout'),
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  //business services
  async getAllBusiness(accessToken: string): Promise<Business[]> {
    const options = {
      method: 'GET',
      url: `${this.utilService.getEnvUrl(
        'business',
      )}?type=1&params=name,email,phone,address,logo,metafields,description,today,schedule,owners,enabled&mode=dashboard`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async getAllBusinessForAdmin(apiKey: string): Promise<Business[]> {
    const options = {
      method: 'GET',
      url: `${this.utilService.getEnvUrl(
        'business',
      )}?type=1&params=name,email,phone,address,logo,metafields,description,today,schedule,owners,enabled&mode=dashboard`,
      headers: {
        accept: 'application/json',
        'x-api-key': apiKey,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async getBusinessById(accessToken: string, businessId: string) {
    const options = {
      method: 'GET',
      url: `${this.utilService.getEnvUrl('business', businessId)}?mode=dashboard`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    try {
      const response = await axios.request(options);

      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async editBusiness(accessToken: string, businessId: number, data: object): Promise<Business> {
    const options = {
      method: 'POST',
      url: `${this.utilService.getEnvUrl('business', businessId)}`,
      data,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    this.logger.warn('edit business', options.url, data);

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async getOrderForBusinesses(
    accessToken: string,
    businessIds: string[],
    query: string,
    paramsQuery: string[],
  ) {
    const options = {
      method: 'GET',
      url: `${this.utilService.getEnvUrl(
        'orders',
      )}?mode=dashboard&where={${query},"business_id":[${businessIds}]}&params=${paramsQuery}`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async getUserKey(accessToken: string, userId: number) {
    const options = {
      method: 'GET',
      url: `https://apiv4.ordering.co/v400/language/peperoni/users/${userId}/keys
      `,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async updateOrder(
    orderingUserId: number,
    orderId: string,
    orderData: Omit<OrderData, 'provider'>,
  ): Promise<OrderingOrder> {
    const accessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const orderingOrder = await this.getOrderById(accessToken, orderId);

    const defaultStatus = {
      [OrderStatusEnum.PENDING]: OrderingOrderStatus.Pending,
      [OrderStatusEnum.IN_PROGRESS]: OrderingOrderStatus.AcceptedByBusiness,
      [OrderStatusEnum.COMPLETED]: OrderingOrderStatus.PreparationCompleted,
      [OrderStatusEnum.PICK_UP_COMPLETED_BY_DRIVER]: OrderingOrderStatus.PickUpCompletedByDriver,
      [OrderStatusEnum.DELIVERED]:
        orderingOrder.delivery_type === OrderingDeliveryType.Delivery
          ? OrderingOrderStatus.PickUpCompletedByDriver
          : OrderingOrderStatus.PickupCompletedByCustomer,
    };
    const status = defaultStatus[orderData.orderStatus];

    const options = {
      method: 'PUT',
      url: `${this.utilService.getEnvUrl('orders', orderId)}`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      data:
        orderData.orderStatus === OrderStatusEnum.PREORDER
          ? {
              prepared_in: orderData.preparedIn,
            }
          : {
              status: status,
              prepared_in: orderData.preparedIn,
            },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async rejectOrder(
    orderingUserId: number,
    orderId: string,
    orderRejectData: {
      reason: string;
    },
  ): Promise<OrderingOrder> {
    const accessToken = await this.utilService.getOrderingAccessToken(orderingUserId);

    const options = {
      method: 'PUT',
      url: `${this.utilService.getEnvUrl('orders', orderId)}`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      data: {
        status: OrderingOrderStatus.RejectedByBusiness,
      },
    };
    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async deleteOrder(accessToken: string, orderId: number) {
    const options = {
      method: 'DELETE',
      url: `${this.utilService.getEnvUrl('orders', orderId)}`,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  //User service
  async getUser(accessToken: string, userId: number) {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl('users', userId),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  //Page
  async getPage(accessToken: string) {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl('pages'),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  /**
   * Set schedule for business
   *
   * @param accessToken
   * @param schedule    Json string of schedule
   * @returns
   */
  async setBusinessSchedule(accessToken: string, schedule: string) {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl('pages'),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async syncOrderingOrder(orderingOrderId: string) {
    const orderingApiKey = await this.prismaService.apiKey.findFirst({
      where: {
        name: 'ORDERING_API_KEY',
      },
    });

    // Validate order exist to update or not

    const order = await this.prismaService.order.findUnique({
      where: {
        orderId: orderingOrderId,
      },
    });

    if (!order) {
      return 'No order found in the database';
    }

    const orderingOrder = await this.getOrderById('', orderingOrderId, orderingApiKey.value);
    const mappedOrderingOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(
      orderingOrder,
    );

    return this.orderingSyncService.syncOrderingOrder(mappedOrderingOrder);
  }

  async getMenuCategory(orderingAccessToken: string, orderingBusinessId: string) {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/categories`),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }
}
