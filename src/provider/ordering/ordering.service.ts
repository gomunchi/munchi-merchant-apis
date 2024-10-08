import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Business as BusinessPrisma, BusinessProviders, Provider } from '@prisma/client';
import axios from 'axios';
import { plainToInstance } from 'class-transformer';
import { Business } from 'ordering-api-sdk';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { AvailableOrderStatus, OrderResponse, OrderStatusEnum } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthCredentials, OrderData } from 'src/type';
import { UtilsService } from 'src/utils/utils.service';
import { ProviderService } from '../provider.service';
import { ProviderEnum } from '../provider.type';
import { WoltCategory, WoltMenuData } from '../wolt/dto/wolt-menu.dto';
import { WoltService } from '../wolt/wolt.service';
import { OrderingMenuCategory } from './dto/ordering-menu.dto';
import { OrderingOrder } from './dto/ordering-order.dto';
import { OrderingMenuMapperService } from './ordering-menu-mapper';
import { OrderingOrderMapperService } from './ordering-order-mapper';
import { OrderingSyncService } from './ordering-sync';
import {
  BusinessFilters,
  OrderingDeliveryType,
  OrderingOrderStatus,
  OrderingUser,
} from './ordering.type';

@Injectable()
export class OrderingService implements ProviderService {
  private readonly logger = new Logger(OrderingService.name);
  private woltApiUrl = this.configService.get('WOLT_API_URL');
  private orderingApiKey = this.configService.get('ORDERING_API_KEY');
  constructor(
    private configService: ConfigService,
    private utilService: UtilsService,
    private readonly prismaService: PrismaService,
    private readonly orderingOrderMapperService: OrderingOrderMapperService,
    private readonly orderingMenuMapperService: OrderingMenuMapperService,
    private readonly orderingSyncService: OrderingSyncService,
    private readonly woltService: WoltService,
    private readonly errorHandlingService: ErrorHandlingService,
    private eventEmitter: EventEmitter2,
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
      const { result: order } = (await axios.request(options)).data;

      const { result: customer } = await this.getUser('', order.customer_id, this.orderingApiKey);

      const updatedOrder: OrderingOrder = {
        ...order,
        customer: {
          ...order.customer,
          phone: customer.cellphone || order.customer.phone,
          cellphone: customer.cellphone || order.customer.cellphone,
        },
      };

      return updatedOrder;
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

  async getFilteredBusinesses(accessToken: string, filters: BusinessFilters, apiKey?: string) {
    const baseUrl = this.utilService.getEnvUrl('business');
    let url = `${baseUrl}?mode=dashboard`;

    if (filters.where) {
      // Use JSON.stringify without URL encoding
      url += `&where=${JSON.stringify(filters.where)}`;
    }

    if (filters.params) {
      url += `&params=${filters.params.join(',')}`;
    }

    const options = {
      method: 'GET',
      url,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
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
      throw error;
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

  async editBusiness(
    accessToken: string,
    businessId: number,
    data: object,
    apiKey?: string,
  ): Promise<Business> {
    const options = {
      method: 'POST',
      url: `${this.utilService.getEnvUrl('business', businessId)}`,
      data,
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    if (apiKey) {
      options.headers['x-api-key'] = apiKey;
    }

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
  ): Promise<OrderResponse> {
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

      if (orderData.orderStatus === OrderStatusEnum.PREORDER) {
        this.eventEmitter.emit('zapier.trigger', response.data.result);
      }

      const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(
        response.data.result,
      );

      return formattedOrder;
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
  ): Promise<OrderResponse> {
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
        reject_reason: orderRejectData.reason,
      },
    };
    try {
      const response = await axios.request(options);

      const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(
        response.data.result,
      );

      return formattedOrder;
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
  async getUser(accessToken: string, userId: number, apiKey?: string) {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl('users', userId),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    };

    if (apiKey) {
      options.headers['x-api-key'] = apiKey;
    }

    try {
      const response = await axios.request(options);
      return response.data;
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

  async getMenuCategory(
    orderingAccessToken: string,
    orderingBusinessId: string,
    apiKey?: string,
  ): Promise<OrderingMenuCategory[]> {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/categories`),
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

  async syncMenu(woltVenueId: string, orderingUserId: number, woltMenuData: WoltMenuData) {
    const woltCredentials = await this.woltService.getWoltCredentials(woltVenueId, 'menu');

    try {
      const response = await axios.post(
        `${this.woltApiUrl}/v1/restaurants/${woltVenueId}/menu`,
        woltMenuData,
        {
          auth: {
            username: woltCredentials.username,
            password: woltCredentials.password,
          },
        },
      );

      return response.data;
    } catch (error: any) {
      throw new ForbiddenException(error.response ? error.response.data : error.message);
    }
  }

  async createCategory(orderingAccessToken: string, orderingBusinessId: string, categoryData: any) {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/categories`),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: {
        name: categoryData.name,
        enabled: categoryData.enabled,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async createProducts(
    orderingAccessToken: string,
    orderingBusinessId: string,
    categoryId: string,
    productData: any,
  ) {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl(
        'business',
        `${orderingBusinessId}/categories/${categoryId}/products`,
      ),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: {
        name: productData.product.name,
        price: productData.product.price,
        description: productData.product.description ?? undefined,
        images: productData.product.image_url ?? undefined,
        enabled: productData.enabled.enabled,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async editCategory(
    orderingAccessToken: string,
    orderingBusinessId: string,
    categoryId: string,
    data: unknown,
  ) {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/categories/${categoryId}`),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: data,
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async createProductsExtraField(orderingAccessToken: string, orderingBusinessId: string) {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/extras`),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: {
        name: 'Extra',
        enabled: true,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async createProductOptions(
    orderingAccessToken: string,
    orderingBusinessId: string,
    extrasId: string,
    optionData: any,
  ) {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl(
        'business',
        `${orderingBusinessId}/extras/${extrasId}/options`,
      ),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: {
        name: optionData.name,
        conditioned: true,
      },
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async editProduct(
    orderingAccessToken: string,
    orderingBusinessId: string,
    categoryId: string,
    productId: string,
    data: unknown,
  ) {
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl(
        'business',
        `${orderingBusinessId}/categories/${categoryId}/products/${productId}`,
      ),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: data,
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async editProductSuboptions(
    orderingAccessToken: string,
    orderingBusinessId: string,
    extraId: string,
    optionId: string,
    suboptionId: string,
    data: unknown,
  ) {
    const options = {
      method: 'PUT',
      url: this.utilService.getEnvUrl(
        'business',
        `${orderingBusinessId}/extras/${extraId}/options/${optionId}/suboptions/${suboptionId}`,
      ),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: data,
    };

    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async createProductOptionsSuboptions(
    orderingAccessToken: string,
    orderingBusinessId: string,
    extraId: string,
    optionId: string,
    data: any,
  ) {
    const subOptionName = data.product.name;
    const price = data.price;
    const enabled = data.enabled.enabled;
    const options = {
      method: 'POST',
      url: this.utilService.getEnvUrl(
        'business',
        `${orderingBusinessId}/extras/${extraId}/options/${optionId}/suboptions`,
      ),
      headers: {
        accept: 'application/json',
        Authorization: `Bearer ${orderingAccessToken}`,
      },
      data: {
        name: subOptionName,
        price: price,
        enabled: enabled,
      },
    };
    try {
      const response = await axios.request(options);
      return response.data.result;
    } catch (error) {
      this.utilService.logError(error);
    }
  }

  async deleteMenuCategory(
    orderingAccessToken: string,
    orderingBusinessId: string,
    categoryId: string,
  ) {
    const options = {
      method: 'DELETE',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/categories/${categoryId}`),
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

  async getProductExtras(orderingAccessToken: string, orderingBusinessId: string, apiKey?: string) {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/extras`),
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

  async deleteProductExtras(
    orderingAccessToken: string,
    orderingBusinessId: string,
    extraId: string,
  ) {
    const options = {
      method: 'DELETE',
      url: this.utilService.getEnvUrl('business', `${orderingBusinessId}/extras/${extraId}`),
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

  async getUnavailableMenuCategory(
    orderingAccessToken: string,
    orderingBusinessId: string,
  ): Promise<OrderingMenuCategory[]> {
    const options = {
      method: 'GET',
      url: this.utilService.getEnvUrl(
        'business',
        `${orderingBusinessId}/categories?where={"enabled":false}`,
      ),
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

  async synchronizeMenuToWolt(
    orderingAccessToken: string,
    business: BusinessPrisma & {
      provider: (BusinessProviders & {
        provider: Provider;
      })[];
    },
  ) {
    const woltVenue = business.provider.filter(
      (provider: any) => provider.provider.name === ProviderEnum.Wolt,
    );

    const menu = await this.getMenuCategory(orderingAccessToken, business.orderingBusinessId);

    const result: WoltCategory[] = menu
      .map((orderingCategory: OrderingMenuCategory) => {
        if (orderingCategory.products.length === 0) {
          return undefined; // Returns undefined
        }
        return this.orderingMenuMapperService.mapToWoltCategory(orderingCategory);
      })
      .filter(Boolean);

    const woltMenuData: WoltMenuData = {
      id: this.utilService.generatePublicId(),
      currency: 'EUR',
      primary_language: 'en',
      categories: result,
    };

    await this.woltService.createMenu(woltVenue[0].providerId, woltMenuData);
  }

  public async getOrderingApiKey() {
    try {
      return await this.prismaService.apiKey.findFirst({
        where: { name: 'ORDERING_API_KEY' },
      });
    } catch (error) {
      this.errorHandlingService.handleError(error, 'getOrderingApiKey');
      throw error; // Re-throw as this is critical for further operations
    }
  }
}
