import { BadRequestException, HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Provider } from '@prisma/client';
import axios, { AxiosRequestConfig } from 'axios';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderData } from 'src/type';
import { UtilsService } from 'src/utils/utils.service';
import { OrderingDeliveryType } from '../ordering/ordering.type';
import { ProviderService } from '../provider.service';
import { ProviderEnum } from '../provider.type';

import { EventEmitter2 } from '@nestjs/event-emitter';
import moment from 'moment';
import { AvailableOrderStatus, OrderResponse, OrderStatusEnum } from 'src/order/dto/order.dto';
import { OrderingMenuMapperService } from '../ordering/ordering-menu-mapper';
import { FoodoraOrder } from './dto/foodora-order-response.dto';
import { GetOrdersIdsResponse, UpdateFoodoraOrderStatusDto } from './dto/foodora-order.dto';
import {
  AvailabilityStatusResponse,
  CloseRestaurantDto,
  FoodoraOrderPrismaSelectArgs,
} from './dto/foodora-restaurant-availability.dto';
import { FoodoraOrderStatus, PosAvailabilityState } from './dto/foodora.enum.dto';
import { MunchiMenu } from './dto/munchi-menu.dto';
import { FoodoraMenuMapperService } from './foodora-menu-mapper';
import { FoodoraOrderMapperService } from './foodora-order-mapper';

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
}

const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
@Injectable()
export class FoodoraService implements ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private foodoraApiUrl: string;
  private foodoraUsername: string;
  private foodoraPassword: string;
  private foodoraSecret: string;
  private readonly defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
  };
  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly orderingMenuMapperService: OrderingMenuMapperService,
    private readonly foodoraOrderMapperService: FoodoraOrderMapperService,
    private eventEmitter: EventEmitter2,
    private readonly foodoraMenuMapperService: FoodoraMenuMapperService,
  ) {
    this.foodoraApiUrl = this.configService.get('FOODORA_API_URL');
    this.foodoraUsername = this.configService.get('FOODORA_AUTH_USERNAME');
    this.foodoraPassword = this.configService.get('FOODORA_AUTH_PASSWORD');
    this.foodoraSecret = this.configService.get('FOODORA_AUTH_SECRET');
  }

  async foodoraLogin(): Promise<string> {
    try {
      const response = await axios.post(
        `${this.foodoraApiUrl}/v2/login`,
        new URLSearchParams({
          username: this.foodoraUsername,
          password: this.foodoraPassword,
          grant_type: 'client_credentials',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const { access_token } = response.data;
      return access_token;
    } catch (error) {
      this.logger.error('Error logging in to Foodora', error);
      throw new Error('Failed to login to Foodora');
    }
  }

  async updateFoodoraOrderStatus(orderId: string, dto: UpdateFoodoraOrderStatusDto): Promise<void> {
    const accessToken = await this.foodoraLogin();
    try {
      const response = await axios.post(`${this.foodoraApiUrl}/v2/order/status/${orderId}`, dto, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Update order status for order ${orderId}: ${response.data}`);
    } catch (error) {
      this.logger.error(`Error updating Foodora order status ${orderId}`, error);
      throw new HttpException('Failed to update Foodora order status', HttpStatus.BAD_REQUEST);
    }
  }

  async markFoodoraOrderAsPrepared(orderId: string): Promise<void> {
    const accessToken = await this.foodoraLogin();

    const options: AxiosRequestConfig = {
      url: `${this.foodoraApiUrl}/v2/orders/${orderId}/preparation-completed`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      this.logger.log(`Update order as preprared for order ${orderId}: ${response.data}`);
    } catch (error) {
      this.logger.error(`Error markFoodoraOrderAsPrepared: ${JSON.stringify(error)}`);
      throw new HttpException('Failed to mark Foodora order as prepared', HttpStatus.BAD_REQUEST);
    }
  }

  async getFoodoraAvailabilityStatus(posVendorId: string): Promise<AvailabilityStatusResponse> {
    const accessToken = await this.foodoraLogin();

    try {
      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/remoteVendors/${posVendorId}/availability`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting Foodora availability status for ${process.env.MUNCHI_CHAINCODE}/${posVendorId}`,
        error,
      );
      throw new HttpException('Failed to get Foodora availability status', HttpStatus.BAD_REQUEST);
    }
  }

  async openFoodoraRestaurant(posVendorId: string): Promise<void> {
    const accessToken = await this.foodoraLogin();
    const { platformKey, platformRestaurantId } = await this.getFoodoraAvailabilityStatus(
      posVendorId,
    ).then((res) => res[0]);

    try {
      await axios.put(
        `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/remoteVendors/${posVendorId}/availability`,
        {
          availabilityState: PosAvailabilityState.OPEN,
          platformKey,
          platformRestaurantId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Error opening Foodora restaurant for ${process.env.MUNCHI_CHAINCODE}/${posVendorId}`,
        error,
      );
      throw new HttpException('Failed to open Foodora restaurant', HttpStatus.BAD_REQUEST);
    }
  }

  async closeFoodoraRestaurant(posVendorId: string, data: CloseRestaurantDto): Promise<void> {
    const accessToken = await this.foodoraLogin();
    const { platformKey, platformRestaurantId } = await this.getFoodoraAvailabilityStatus(
      posVendorId,
    ).then((res) => res[0]);

    try {
      await axios.put(
        `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/remoteVendors/${posVendorId}/availability`,
        {
          ...data,
          platformKey,
          platformRestaurantId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (error) {
      this.logger.error(
        `Error closing Foodora restaurant for ${process.env.MUNCHI_CHAINCODE}/${posVendorId}`,
        error,
      );
      throw new HttpException('Failed to close Foodora restaurant', HttpStatus.BAD_REQUEST);
    }
  }

  async getOrdersIds(
    status: 'cancelled' | 'accepted',
    pastNumberOfHours = 24,
    vendorId?: string,
  ): Promise<GetOrdersIdsResponse> {
    const accessToken = await this.foodoraLogin();

    try {
      const queryParams = new URLSearchParams({
        status,
        pastNumberOfHours: pastNumberOfHours.toString(),
      });

      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${
          process.env.MUNCHI_CHAINCODE
        }/orders/ids?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      console.log('Error', JSON.stringify(error));
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig = this.defaultRetryConfig,
  ): Promise<T> {
    let lastError: Error;
    let delay = config.initialDelayMs;

    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryableError(error)) {
          throw error;
        }

        if (attempt === config.maxRetries) {
          break;
        }

        this.logger.warn(`Attempt ${attempt} failed for operation. Retrying in ${delay}ms...`, {
          error: lastError.message,
          attempt,
          delay,
        });

        await sleep(delay);
        delay = Math.min(delay * config.backoffFactor, config.maxDelayMs);
      }
    }

    throw new Error(
      `Operation failed after ${config.maxRetries} attempts. Last error: ${lastError.message}`,
    );
  }

  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const statusCode = error.response?.status;
      console.log('🚀 ~ FoodoraService ~ isRetryableError ~ statusCode:', statusCode);

      // Retry on network errors or specific HTTP status codes
      return (
        !statusCode || // Network error
        statusCode === 408 || // Request Timeout
        statusCode === 429 || // Too Many Requests
        statusCode >= 500
      ); // Server errors
    }

    return false;
  }

  async getOrderDetails(orderId: string): Promise<FoodoraOrder> {
    const accessToken = await this.foodoraLogin();

    const options: AxiosRequestConfig = {
      url: `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/orders/${orderId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };
    console.log('get order detail options: ', JSON.stringify(options));
    try {
      const response = await axios.request(options);

      return response.data.order;
    } catch (error) {
      this.logger.error('Error getOrderDetails', {
        orderId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error; // Rethrow to be handled by retry mechanism
    }
  }

  extractOrderId(token: string): string {
    try {
      this.logger.debug(`Attempting to extract order ID from token: ${this.maskToken(token)}`);

      if (!token) {
        this.logger.error('Token is empty or undefined');
        throw new Error('Token is required');
      }

      const parts = token.split('-_-');

      if (parts.length !== 3) {
        this.logger.error(`Invalid token format. Expected 3 parts, got ${parts.length}`);
        throw new Error('Invalid Foodora token format');
      }

      const orderId = parts[1];
      this.logger.debug(`Successfully extracted order ID: ${orderId}`);

      return orderId;
    } catch (error) {
      this.logger.error(`Failed to extract order ID: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  // Helper method to mask sensitive data in logs
  private maskToken(token: string): string {
    if (!token) return 'undefined';
    if (token.length <= 8) return '***';

    return `${token.slice(0, 4)}...${token.slice(-4)}`;
  }

  async submitCatalog(catalogImportDto: any): Promise<void> {
    const accessToken = await this.foodoraLogin();

    try {
      const response = await axios.put(
        `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/catalog`,
        catalogImportDto,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Catalog submitted successfully for chain ${process.env.MUNCHI_CHAINCODE}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error submitting catalog for chain ${process.env.MUNCHI_CHAINCODE}`,
        error,
      );
      throw new HttpException('Failed to submit catalog', HttpStatus.BAD_REQUEST);
    }
  }

  async getCatalogLogs(chainCode: string, vendorId: number): Promise<void> {
    const accessToken = await this.foodoraLogin();

    try {
      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${chainCode}/vendors/${vendorId}/menu-import-logs?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting catalog logs for chain ${chainCode} and vendor ${vendorId}`,
        error,
      );
      throw new HttpException('Failed to get catalog logs', HttpStatus.BAD_REQUEST);
    }
  }

  async getOrderById(id: string): Promise<FoodoraOrder> {
    const parsedId = Number(id);
    if (!Number.isInteger(parsedId)) {
      throw new BadRequestException('Invalid order ID: must be an integer');
    }

    const order = await this.prismaService.order.findUnique({
      where: {
        id: parsedId,
      },
      include: FoodoraOrderPrismaSelectArgs,
    });

    if (!order) {
      return null;
    }

    const transformedOrder: FoodoraOrder = {
      ...order,
      products: order.products.map((product) => ({
        ...product,
        quantity: product.quantity.toString(),
      })),
      customer: {
        firstName: order.customer.name.split(' ')[0],
        lastName: order.customer.name.split(' ')[1],
        mobilePhone: order.customer.phone,
      },
    };

    return transformedOrder;
  }

  async getOrderFromFoodoraByStatus(
    accessToken: string,
    status: AvailableOrderStatus[],
    businessIds: string[],
  ): Promise<OrderResponse[]> {
    let orderIds = [];
    if (status.includes(OrderStatusEnum.IN_PROGRESS)) {
      const acceptedOrders = await this.getOrdersIds('accepted');
      orderIds = acceptedOrders.orders;
    } else if (status.includes(OrderStatusEnum.REJECTED)) {
      const cancelledOrders: any = await this.getOrdersIds('cancelled');
      orderIds = cancelledOrders.orders;
    } else {
      throw new BadRequestException('Foodora does not support this order status');
    }

    const orders = await Promise.all(
      orderIds.map(async (orderId) => {
        const order = await this.getOrderDetails(orderId);
        return this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);
      }),
    );

    return orders;
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
        provider: ProviderEnum.Foodora,
        orderingBusinessId: {
          in: businessIds,
        },
      },
      orderBy: orderBy,
      include: FoodoraOrderPrismaSelectArgs,
    });

    return orders;
  }
  async updateOrder(
    orderingUserId: number,
    orderId: string,
    orderData: Omit<OrderData, 'provider'>,
    providerInfo?: Provider,
  ): Promise<any> {
    let status: AvailableOrderStatus = orderData.orderStatus;

    try {
      // Single database query with required relations
      const order = await this.prismaService.order.findUnique({
        where: { id: +orderId },
        include: FoodoraOrderPrismaSelectArgs,
      });

      const preparationTime = orderData.preparedIn
        ? moment().add(orderData.preparedIn, 'minutes').toISOString()
        : new Date().toISOString();

      // Handle status updates using a more maintainable switch statement
      await this.handleStatusUpdate(order, orderData.orderStatus, preparationTime);

      if (
        order.deliveryType === OrderingDeliveryType.PickUp &&
        orderData.orderStatus === OrderStatusEnum.COMPLETED
      ) {
        status = OrderStatusEnum.COMPLETED;
      }

      // Handle delivery type specific logic
      if (
        order.deliveryType === OrderingDeliveryType.Delivery &&
        orderData.orderStatus === OrderStatusEnum.PICK_UP_COMPLETED_BY_DRIVER
      ) {
        status = OrderStatusEnum.DELIVERED;
      }

      // Update the order in the database
      const updatedOrder = await this.prismaService.order.update({
        where: { id: +orderId },
        data: {
          status,
          lastModified: new Date().toISOString(),
          // Add any other fields that need updating
        },
        include: FoodoraOrderPrismaSelectArgs,
      });

      // // Notify about changes
      // this.eventEmitter.emit(
      //   'database.notifyChanges',
      //   ProviderEnum.Foodora,
      //   order.orderId,
      //   order.business.publicId,
      // );

      return updatedOrder;
    } catch (error) {
      this.logger.error(
        `Error updating Foodora order ${orderId} to status ${orderData.orderStatus}`,
        error instanceof Error ? error.message : 'Unknown error',
        error instanceof Error ? error.stack : '',
      );

      throw new HttpException(
        `Failed to update Foodora order: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async handleStatusUpdate(
    order: any,
    newStatus: OrderStatusEnum,
    preparationTime: string,
  ): Promise<void> {
    switch (newStatus) {
      case OrderStatusEnum.IN_PROGRESS:
        await this.updateFoodoraOrderStatus(order.orderId, {
          acceptanceTime: preparationTime,
          remoteOrderId: order.orderId.split('-_-')[1],
          status: FoodoraOrderStatus.Accepted,
        });
        break;

      case OrderStatusEnum.COMPLETED:
        if (order.deliveryType === OrderingDeliveryType.Delivery) {
          await this.markFoodoraOrderAsPrepared(order.orderId);
        }
        break;

      case OrderStatusEnum.DELIVERED:
        if (order.deliveryType === OrderingDeliveryType.PickUp) {
          await this.updateFoodoraOrderStatus(order.orderId, {
            status: FoodoraOrderStatus.PickedUp,
          });
        }
        break;
    }
  }

  async rejectOrder(
    orderingUserId: number,
    orderId: string,
    orderRejectData: { reason: string },
    providerInfo?: Provider,
  ): Promise<any> {
    const existingOrder = await this.prismaService.order.findUnique({
      where: {
        id: Number(orderId),
      },
    });

    try {
      await this.updateFoodoraOrderStatus(existingOrder.orderId, {
        status: FoodoraOrderStatus.Rejected,
        reason: orderRejectData.reason,
      });
    } catch (error) {
      this.logger.error(`Error rejecting Foodora order ${orderId}`, error);
      throw new HttpException('Failed to reject Foodora order', HttpStatus.BAD_REQUEST);
    }

    return await this.prismaService.order.update({
      where: {
        orderId: existingOrder.orderId,
      },
      data: {
        status: OrderStatusEnum.REJECTED,
        comment: orderRejectData.reason,
        lastModified: moment().toISOString(),
      },
    });
  }

  async getMunchiMenu(): Promise<MunchiMenu> {
    try {
      const response = await axios.get(
        'https://apiv4.ordering.co/v400/en/peperoni/business/351?mode=dashboard',
        {
          headers: {
            'x-api-key': process.env.MUNCHI_ORDERING_API_KEY,
            Accept: 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      this.logger.error('Error getting Munchi menu', error);
      throw new HttpException('Failed to get Munchi menu', HttpStatus.BAD_REQUEST);
    }
  }

  async syncMunchiMenu(): Promise<any> {
    const munchiMenu = await this.getMunchiMenu();

    const mappedMenu = await this.foodoraMenuMapperService.mapMenuToCatalogImportDto(munchiMenu);

    const result = await this.submitCatalog(mappedMenu);
    return mappedMenu;
  }
}
