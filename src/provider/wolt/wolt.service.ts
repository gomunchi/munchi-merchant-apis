import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Provider } from '@prisma/client';
import axios from 'axios';
import moment from 'moment';
import {
  AvailableOrderStatus,
  OrderResponse,
  OrderResponsePreOrderStatusEnum,
  OrderStatusEnum,
} from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderData } from 'src/type';
import { UtilsService } from 'src/utils/utils.service';
import { OrderingDeliveryType } from '../ordering/ordering.type';
import { ProviderService } from '../provider.service';
import { ProviderEnum } from '../provider.type';
import { WoltOrderV2 } from './dto/wolt-order-v2.dto';
import { WoltOrderPrismaSelectArgs, WoltOrderType } from './dto/wolt-order.dto';

import { WoltCategory as WoltMenuCategory } from './dto/wolt-menu.dto';

import {
  OrderingCategoryProductExtra,
  OrderingMenuCategory,
} from '../ordering/dto/ordering-menu.dto';
import { OrderingMenuMapperService } from '../ordering/ordering-menu-mapper';
import { WoltMenuData } from './dto/wolt-menu.dto';
import { WoltOrderMapperService } from './wolt-order-mapper';
import { WoltRepositoryService } from './wolt-repository';
import { WoltSyncService } from './wolt-sync';

@Injectable()
export class WoltService implements ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private woltApiUrl: string;
  private woltMenuApiDelayTime: number;
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private utilsService: UtilsService,
    private woltOrderMapperService: WoltOrderMapperService,
    private woltRepositoryService: WoltRepositoryService,
    private woltSyncService: WoltSyncService,
    private orderingMenuMapperService: OrderingMenuMapperService,
  ) {
    this.woltApiUrl = this.configService.get('WOLT_API_URL');
    this.woltMenuApiDelayTime = 15;
  }

  async getOrderByStatus(
    _,
    status: AvailableOrderStatus[],
    businessIds: string[],
    orderBy?: Prisma.OrderOrderByWithRelationInput,
  ): Promise<any[]> {
    const orders = await this.prismaService.order.findMany({
      where: {
        status: {
          in: status,
        },
        provider: ProviderEnum.Wolt,
        orderingBusinessId: {
          in: businessIds,
        },
      },
      orderBy: orderBy,
      include: WoltOrderPrismaSelectArgs,
    });

    return orders;
  }

  async getWoltCredentials(woltVenueId: string, apiType: 'order' | 'menu') {
    let woltCredentials: {
      data: unknown;
    }; // API Keys are typically strings

    const providerInputArgs = Prisma.validator<Prisma.ProviderFindUniqueArgs>()({
      where: {
        id: woltVenueId,
      },
      include: {
        credentials: true,
      },
    });

    const provider = await this.prismaService.provider.findUnique(providerInputArgs);

    if (apiType === 'order') {
      woltCredentials = provider.credentials.find(
        (credential) => credential.name === 'Order' && credential.type === 'api-key',
      ) as any;
    } else {
      woltCredentials = provider.credentials.find(
        (credential) => credential.name === 'Menu' && credential.type === 'basic-auth',
      ) as any;
    }

    if (!woltCredentials) {
      throw new BadRequestException(`Can't get wolt credentials from database`);
    }

    return woltCredentials.data as any;
  }

  /**
   * Asynchronously retrieves Wolt order data from the Wolt server.
   *
   * @param   {string<WoltOrder>}   woltOrdeId  Wolt order id
   *
   * @return  {Promise<WoltOrder>}              A promise that resolves with the Wolt order data from the Wolt server.
   */
  public async getOrderById(woltApiKey: string, woltOrdeId: string): Promise<WoltOrderV2> {
    try {
      const response = await axios.request({
        method: 'GET',
        baseURL: `${this.woltApiUrl}/orders/${woltOrdeId}`,
        headers: {
          'WOLT-API-KEY': woltApiKey,
          'Content-Type': 'application/vnd.wolt.order+json;version=2beta1',
        },
      });

      return response.data;
    } catch (error) {
      this.handleWoltError(error);
    }
  }

  async sendWoltUpdateRequest(
    woltOrderId: string,
    endpoint: string,
    orderType: WoltOrderType,
    woltApiKey: string,
    updateData?: Omit<OrderData, 'provider'>,
  ) {
    const option = {
      method: 'PUT',
      baseURL: `${this.woltApiUrl}/orders/${woltOrderId}/${endpoint}`,
      headers: {
        'WOLT-API-KEY': woltApiKey,
      },
      data:
        endpoint === 'reject'
          ? {
              reason: updateData.reason
                ? updateData.reason
                : 'Your order has been rejected, please contact the restaurant for more info',
            }
          : endpoint === 'accept' && orderType === WoltOrderType.Instant
          ? {
              adjusted_pickup_time: updateData.preparedIn,
            }
          : null,
    };
    try {
      const response = await axios.request(option);
      return response.data;
    } catch (error: any) {
      this.logger.log(
        `Error when updating wolt Order with order id:${woltOrderId}. Error: ${error}`,
      );

      await this.syncWoltOrder(woltApiKey, woltOrderId);
      throw new ForbiddenException(error);
    }
  }

  /**
   * This service takes a Wolt order ID as input to update the corresponding order.
   * It follows the following steps:
   * 1. Retrieve the order details from the Wolt server using the provided order ID.
   * 2. Check if the retrieved order matches the current order in the local database and meets all conditions.
   * 3. If conditions are met, send a PUT request to the server to update the order.
   * 4. Sync the updated order data with the local database to maintain consistency.
   *
   * @param {string} woltOrderId - The Wolt order ID to identify the order to be updated.
   * @returns {Promise<void>} A promise that resolves when the update and synchronization process is complete.
   * @throws {Error} If any issues occur during the retrieval, validation, or update process.
   */
  public async updateOrder(
    orderingUserId: number,
    woltOrderId: string,
    { orderStatus, preparedIn }: Omit<OrderData, 'provider'>,
    providerInfo: Provider,
  ): Promise<any> {
    const venueId = providerInfo.id;

    // Get wolt api key from database
    const woltCredentials = await this.getWoltCredentials(venueId, 'order');

    const order = await this.woltRepositoryService.getOrderByIdFromDb(woltOrderId);

    const updateEndPoint = this.generateWoltUpdateEndPoint(orderStatus, order as any);

    if (order.status === OrderStatusEnum.DELIVERED) {
      return;
    }

    if (orderStatus === OrderStatusEnum.PICK_UP_COMPLETED_BY_DRIVER) {
      return this.updateAndReturn(order, null, orderStatus);
    }

    try {
      const adjustedPickupTime = preparedIn
        ? moment(order.createdAt).add(preparedIn, 'minutes').format()
        : order.pickupEta;

      await this.sendWoltUpdateRequest(
        order.orderId,
        updateEndPoint,
        order.type as WoltOrderType,
        woltCredentials.value,
        {
          orderStatus: OrderStatusEnum.IN_PROGRESS,
          preparedIn: adjustedPickupTime,
        },
      );

      if (
        order.deliveryType === OrderingDeliveryType.Delivery &&
        order.status === OrderStatusEnum.PENDING
      ) {
        const maxRetries = 10;
        const retryInterval = 500;
        const syncPickUpTime = await this.getOrderById(woltCredentials.value, order.orderId);
        const formattedSyncOrder = await this.woltOrderMapperService.mapOrderToOrderResponse(
          syncPickUpTime,
        );

        const woltOrderMoment = moment(formattedSyncOrder.pickupEta);
        const formattedSyncOrderMoment = moment(order.pickupEta);
        let hasPickupTimeUpdated = false;
        for (let i = 0; i < maxRetries; i++) {
          if (!woltOrderMoment.isSame(formattedSyncOrderMoment, 'millisecond')) {
            hasPickupTimeUpdated = true;
          } else {
            await new Promise((resolve) => setTimeout(resolve, retryInterval));
          }
        }

        if (hasPickupTimeUpdated) {
          await this.syncWoltOrder(woltCredentials.value, order.orderId);
        }
      }

      return this.updateAndReturn(order, preparedIn, orderStatus);
    } catch (error) {
      this.logger.log(`Error when updating order: ${error}`);
      throw new ForbiddenException(error);
    }
  }

  private async updateAndReturn(
    order: any,
    preparedIn: string | null,
    orderStatus: AvailableOrderStatus,
  ): Promise<any> {
    const updatedOrder = await this.updateOrderInDatabase(order, preparedIn, orderStatus);
    return updatedOrder;
  }

  async updateOrderInDatabase(
    order: any,
    preparedIn?: string,
    orderStatus?: AvailableOrderStatus,
  ): Promise<any> {
    const updatedOrder = await this.prismaService.order.update({
      where: {
        orderId: order.orderId,
      },
      data: {
        preparedIn: preparedIn ?? order.preparedIn,
        status: orderStatus,
        preorder: order.preorder
          ? {
              update: {
                preorderTime: order.preorder.preorderTime,
                status: OrderResponsePreOrderStatusEnum.Confirm,
              },
            }
          : undefined,
        lastModified: moment().toISOString(true),
      },
      include: WoltOrderPrismaSelectArgs,
    });

    return updatedOrder;
  }

  public async rejectOrder(
    orderingUserId: number,
    orderId: string,
    orderRejectData: {
      reason: string;
    },
    providerInfo: Provider,
  ): Promise<any> {
    const woltVenueId = providerInfo.id;

    const order = await this.woltRepositoryService.getOrderByIdFromDb(orderId);

    const woltCredentials = await this.getWoltCredentials(woltVenueId, 'order');

    await this.sendWoltUpdateRequest(
      order.orderId,
      'reject',
      order.type as WoltOrderType,
      woltCredentials.value,
      {
        reason: orderRejectData.reason,
        orderStatus: OrderStatusEnum.REJECTED,
        preparedIn: null,
      },
    );

    const updatedOrder = await this.prismaService.order.update({
      where: {
        orderId: order.orderId,
      },
      data: {
        status: OrderStatusEnum.REJECTED,
      },
      include: WoltOrderPrismaSelectArgs,
    });
    return updatedOrder;
  }

  async syncWoltOrder(woltApiKey: string, woltOrderId: string) {
    const woltOrder = await this.getOrderById(woltApiKey, woltOrderId);
    const mappedWoltOrder = await this.woltOrderMapperService.mapOrderToOrderResponse(woltOrder);

    const order = await this.prismaService.order.findUnique({
      where: {
        orderId: woltOrderId,
      },
    });

    if (
      order.status === OrderStatusEnum.PICK_UP_COMPLETED_BY_DRIVER &&
      mappedWoltOrder.status === OrderStatusEnum.COMPLETED
    ) {
      return;
    }

    await this.woltSyncService.syncWoltOrder(mappedWoltOrder);
  }

  async getWoltBusinessById(woltVenueId: string, orderingUserId: number) {
    const woltCredentals = await this.getWoltCredentials(woltVenueId, 'order');

    const option = {
      method: 'GET',
      baseURL: `${this.woltApiUrl}/venues/${woltVenueId}/status`,
      headers: {
        'WOLT-API-KEY': woltCredentals.value,
      },
    };
    try {
      const response = await axios.request(option);

      return response.data;
    } catch (error: any) {
      // await this.syncWoltBusiness(woltOrderId);
      throw new ForbiddenException(error);
    }
  }

  async setWoltVenueStatus(woltVenueId: string, status: boolean, time?: Date) {
    const woltCredentials = await this.getWoltCredentials(woltVenueId, 'order');

    const option = {
      method: 'PATCH',
      baseURL: `${this.woltApiUrl}/venues/${woltVenueId}/online`,
      headers: {
        'WOLT-API-KEY': woltCredentials.value,
      },
      data: {
        status: status ? 'ONLINE' : 'OFFLINE',
        until: time ? time : null,
      },
    };

    try {
      const response = await axios.request(option);

      return response.data;
    } catch (error: any) {
      throw new ForbiddenException(error);
    }
  }

  async getMenuCategory(orderingUserId: number, woltVenueId: string) {
    const woltCredentials = await this.getWoltCredentials(woltVenueId, 'menu');

    try {
      const response = await axios.get(`${this.woltApiUrl}/v2/venues/${woltVenueId}/menu`, {
        auth: {
          username: woltCredentials.username,
          password: woltCredentials.password,
        },
      });
      const { resource_url } = response.data;

      await new Promise((resolve) => setTimeout(resolve, 1500)); // 1000ms = 1 second

      const menuResponse = await axios.get(resource_url);

      return menuResponse.data;
    } catch (error: any) {
      return {
        error: error.response ? error.response.data : error.message,
        statusCode: error.response.status,
      };
    }
  }

  async editMenu(woltVenueId: string, orderingUserId: number, woltMenuData: WoltMenuData) {
    const woltCredentials = await this.getWoltCredentials(woltVenueId, 'menu');

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

  async editProduct(woltVenueId: string, woltEditBodyData: unknown) {
    const woltCredentials = await this.getWoltCredentials(woltVenueId, 'menu');

    const option = {
      method: 'PATCH',
      baseURL: `${this.woltApiUrl}/venues/${woltVenueId}/items`,
      auth: {
        username: woltCredentials.username,
        password: woltCredentials.password,
      },
      data: {
        data: woltEditBodyData,
      },
    };

    try {
      const response = await axios.request(option);

      return response.data;
    } catch (error: any) {
      console.log(error.response ? error.response.data : error.message);
      this.menuApiCallBack(woltVenueId, 'cooldown');
      // throw new ForbiddenException(error.response ? error.response.data : error.message);
    }
  }

  async editMenuOption(woltVenueId: string, woltOptionBodyData: unknown) {
    const woltCredentials = await this.getWoltCredentials(woltVenueId, 'menu');

    const option = {
      method: 'PATCH',
      baseURL: `${this.woltApiUrl}/venues/${woltVenueId}/options/values`,
      auth: {
        username: woltCredentials.username,
        password: woltCredentials.password,
      },
      data: {
        data: woltOptionBodyData,
      },
    };

    try {
      const response = await axios.request(option);

      return response.data;
    } catch (error: any) {
      throw new ForbiddenException(error.response ? error.response.data : error.message);
    }
  }

  async createMenu(woltVenueId: string, woltMenuData: WoltMenuData) {
    const woltCredentials = await this.getWoltCredentials(woltVenueId, 'menu');
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

  async syncMenu(
    woltVenueId: string,
    orderingMenuData: OrderingMenuCategory[],
    orderingMenuOption: OrderingCategoryProductExtra[],
  ) {
    //Check category if there is false

    const updatedMenuData = orderingMenuData.flatMap((category) => {
      // Create a copy of the products array to avoid mutation
      const updatedProducts = category.products.map((product) => ({
        external_id: product.id,
        enabled: category.enabled === false ? false : product.enabled,
      }));

      // Include product data only if the category is enabled or the product has an explicit enabled value
      return category.enabled || updatedProducts.some((p) => p.enabled !== undefined)
        ? updatedProducts
        : [];
    });

    // Synchronizing option

    const formattedOption = orderingMenuOption.flatMap((extra) => {
      // Filter enabled options
      const enabledOptions = extra.options.filter((option) => option.enabled);

      // Extract enabled suboptions from each enabled option
      const filteredSuboptions = enabledOptions.flatMap((option) =>
        option.suboptions.map((suboption) => ({
          external_id: suboption.id,
          enabled: suboption.enabled,
        })),
      );

      // Return the filtered suboptions array (or an empty array if no enabled options)
      return filteredSuboptions;
    });

    try {
      // Synchronizing product
      await this.editProduct(woltVenueId, updatedMenuData);

      // Synchronizing product option
      await this.editMenuOption(woltVenueId, formattedOption);

      await this.menuApiCallBack(woltVenueId, 'success');

      this.logger.log('Succesfully synchronize business data, should fall back to normal state');
    } catch (error) {
      await this.menuApiCallBack(woltVenueId, 'cooldown');
      this.handleWoltError(error);
    }
  }

  async syncProduct(woltVenueId: string, orderingMenuData: OrderingMenuCategory[]) {
    const result: WoltMenuCategory[] = orderingMenuData
      .map((orderingCategory: OrderingMenuCategory) => {
        if (orderingCategory.products.length === 0) {
          return undefined; // Returns undefined
        }
        return this.orderingMenuMapperService.mapToWoltCategory(orderingCategory);
      })
      .filter(Boolean);

    const woltMenuData: WoltMenuData = {
      id: this.utilsService.generatePublicId(),
      currency: 'EUR',
      primary_language: 'en',
      categories: result,
    };

    await this.createMenu(woltVenueId, woltMenuData);
  }

  async syncProductOption(woltVenueId: string, orderingMenuData: OrderingMenuCategory[]) {
    const result: WoltMenuCategory[] = orderingMenuData
      .map((orderingCategory: OrderingMenuCategory) => {
        if (orderingCategory.products.length === 0) {
          return undefined; // Returns undefined
        }
        return this.orderingMenuMapperService.mapToWoltCategory(orderingCategory);
      })
      .filter(Boolean);

    const woltMenuData: WoltMenuData = {
      id: this.utilsService.generatePublicId(),
      currency: 'EUR',
      primary_language: 'en',
      categories: result,
    };

    await this.createMenu(woltVenueId, woltMenuData);
  }

  async menuApiCallBack(woltVenueId: string, state: 'success' | 'cooldown') {
    console.log('Executing callback process');
    const business = await this.prismaService.businessProviders.findUnique({
      where: {
        providerId: woltVenueId,
      },
      include: {
        business: {
          select: {
            publicId: true,
          },
        },
      },
    });

    const menuTracking = await this.prismaService.menuTracking.findUnique({
      where: {
        businessPublicId: business.business.publicId,
      },
    });

    const nextSynchronizeTime = moment(menuTracking.lastUpdated)
      .add(this.woltMenuApiDelayTime, 'minutes')
      .toISOString();

    const updateData: Prisma.MenuTrackingUncheckedUpdateInput = {
      processing: false, // Always update processing regardless of state
      onCooldown: false,
      lastUpdated: moment().toISOString(),
    };

    if (state === 'cooldown') {
      updateData.processing = true;
      updateData.onCooldown = true;
      updateData.synchronizeTime = nextSynchronizeTime;
    }

    await this.prismaService.menuTracking.update({
      where: {
        businessPublicId: business.business.publicId,
      },
      data: updateData,
    });
  }

  generateWoltUpdateEndPoint(orderStatus: AvailableOrderStatus, woltOrderFromDb: OrderResponse) {
    if (orderStatus === OrderStatusEnum.PREORDER) {
      return 'confirm-preorder';
    } else if (orderStatus === OrderStatusEnum.IN_PROGRESS) {
      return 'accept';
    } else if (
      orderStatus === OrderStatusEnum.COMPLETED &&
      woltOrderFromDb.status !== OrderStatusEnum.COMPLETED
    ) {
      return 'ready';
    } else if (orderStatus === OrderStatusEnum.DELIVERED) {
      return 'delivered';
    } else if (orderStatus === OrderStatusEnum.REJECTED) {
      return 'reject';
    } else {
      return '';
    }
  }

  async handleWoltError(error: any) {
    if (error.response) {
      this.logger.error('Wolt API Error:', error.response.data);

      throw new HttpException(
        {
          message: 'Error from Wolt API',
          status: error.response.status,
          details: error.response.data,
        },
        error.response.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.logger.error('Unexpected Wolt Error:', error);
    throw new HttpException(
      {
        message: 'Unexpected error when communicating with Wolt',
        details: error.message,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}
