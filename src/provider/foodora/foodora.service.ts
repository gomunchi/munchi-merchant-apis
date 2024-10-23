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

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import moment from 'moment';
import { AvailableOrderStatus, OrderStatusEnum } from 'src/order/dto/order.dto';
import { OrderingMenuMapperService } from '../ordering/ordering-menu-mapper';
import { FoodoraOrder } from './dto/foodora-order-response.dto';
import { UpdateFoodoraOrderStatusDto } from './dto/foodora-order.dto';
import {
  AvailabilityStatusResponse,
  CloseRestaurantDto,
  FoodoraOrderPrismaSelectArgs,
  TOKEN_CONFIGS,
  TokenType,
} from './dto/foodora-restaurant-availability.dto';
import { FoodoraOrderStatus, PosAvailabilityState, PosClosingReason } from './dto/foodora.enum.dto';
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

  async foodoraLogin({
    grant_type,
    password,
    username,
  }: {
    username: string;
    password: string;
    grant_type: string;
  }): Promise<string> {
    try {
      const response = await axios.post(
        `${this.foodoraApiUrl}/v2/login`,
        new URLSearchParams({
          username: username,
          password: password,
          grant_type: grant_type,
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

  async updateFoodoraOrderStatus(
    foodoraToken: string,
    orderId: string,
    dto: UpdateFoodoraOrderStatusDto,
  ): Promise<void> {
    try {
      const response = await axios.post(`${this.foodoraApiUrl}/v2/order/status/${orderId}`, dto, {
        headers: {
          Authorization: `Bearer ${foodoraToken}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Update order status for order ${orderId}: ${JSON.stringify(response.data)}`);
    } catch (error) {
      this.logger.error(`Error updating Foodora order status ${orderId}`, error);
      throw new HttpException('Failed to update Foodora order status', HttpStatus.BAD_REQUEST);
    }
  }

  async markFoodoraOrderAsPrepared(foodoraToken: string, orderId: string): Promise<void> {
    const options: AxiosRequestConfig = {
      url: `${this.foodoraApiUrl}/v2/orders/${orderId}/preparation-completed`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${foodoraToken}`,
      },
    };

    try {
      const response = await axios.request(options);
      this.logger.log(
        `Update order as preprared for order ${orderId}: ${JSON.stringify(response.data)}`,
      );
    } catch (error) {
      this.logger.error(`Error markFoodoraOrderAsPrepared: ${JSON.stringify(error)}`);
      throw new HttpException('Failed to mark Foodora order as prepared', HttpStatus.BAD_REQUEST);
    }
  }

  async getFoodoraAvailabilityStatus(
    foodoraToken: string,
    orderingBusiessId: string,
    posVendorId: string,
  ): Promise<AvailabilityStatusResponse> {
    const extractedPosVendorId = this.extractId(posVendorId, 'vendor');

    const options: AxiosRequestConfig = {
      url: `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/remoteVendors/${orderingBusiessId}/availability`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${foodoraToken}`,
      },
    };
    try {
      const response = await axios.request(options);

      const vendorAvailability: AvailabilityStatusResponse = response.data.find(
        (data: AvailabilityStatusResponse) => data.platformRestaurantId === extractedPosVendorId,
      );

      return vendorAvailability;
    } catch (error) {
      this.logger.error(
        `Error getting Foodora availability status for ${process.env.MUNCHI_CHAINCODE}/${posVendorId}`,
        error,
      );
      throw new HttpException('Failed to get Foodora availability status', HttpStatus.BAD_REQUEST);
    }
  }

  async getFoodoraCredentials(
    posVendorId: string,
    type: 'Order' | 'Menu',
  ): Promise<{
    username: string;
    password: string;
    grant_type: string;
  } | null> {
    const providerFindUniqueArgs = Prisma.validator<Prisma.ProviderFindUniqueArgs>()({
      where: {
        id: posVendorId,
      },
      include: {
        credentials: true,
      },
    });

    const posVendor = await this.prismaService.provider.findUnique(providerFindUniqueArgs);

    const credentials = posVendor.credentials.find((cred) => cred.name === type);

    if (!credentials) return null;
    return credentials.data as any;
  }

  @OnEvent('Foodora.venueStatus')
  async setFoodoraVendorStatus(
    orderingBusinessId: string,
    posVendorId: string,
    status: boolean,
    duration?: number,
  ): Promise<void> {
    this.logger.log(
      `Setting Foodora venue status - Venue ID: ${posVendorId}, Status: ${status}, Time in minutes: ${
        duration || 'N/A'
      }`,
    );

    // Get Foodora credentials
    const foodoraCredentials = await this.getFoodoraCredentials(posVendorId, 'Order');

    // Login to Foodora system
    const foodoraToken = await this.foodoraLogin(foodoraCredentials);

    const { platformKey, platformRestaurantId } = await this.getFoodoraAvailabilityStatus(
      foodoraToken,
      orderingBusinessId,
      posVendorId,
    );

    const closeData: CloseRestaurantDto = {
      availabilityState: PosAvailabilityState.CLOSED,
      closedReason: PosClosingReason.CLOSED,
      closingMinutes: duration,
    };

    const options: AxiosRequestConfig = {
      method: 'PUT',
      url: `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/remoteVendors/${orderingBusinessId}/availability`,
      data: {
        ...(status
          ? {
              availabilityState: PosAvailabilityState.OPEN,
            }
          : closeData),
        platformKey,
        platformRestaurantId,
      },
      headers: {
        Authorization: `Bearer ${foodoraToken}`,
      },
    };

    try {
      const response = await axios.request(options);
    } catch (error) {
      this.logger.error(
        `Error ${status ? 'opening' : 'closing'} Foodora restaurant for ${
          process.env.MUNCHI_CHAINCODE
        }/${posVendorId}`,
        error,
      );
      throw new HttpException(
        `Failed to ${status ? 'open' : 'close'} Foodora restaurant`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // async getOrdersIds(
  //   status: 'cancelled' | 'accepted',
  //   pastNumberOfHours = 24,
  //   vendorId?: string,
  // ): Promise<GetOrdersIdsResponse> {
  //   const accessToken = await this.foodoraLogin();

  //   try {
  //     const queryParams = new URLSearchParams({
  //       status,
  //       pastNumberOfHours: pastNumberOfHours.toString(),
  //     });

  //     const response = await axios.get(
  //       `${this.foodoraApiUrl}/v2/chains/${
  //         process.env.MUNCHI_CHAINCODE
  //       }/orders/ids?${queryParams.toString()}`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${accessToken}`,
  //         },
  //       },
  //     );

  //     return response.data;
  //   } catch (error) {
  //     console.log('Error', JSON.stringify(error));
  //   }
  // }

  async getOrderDetails(foodoraToken: string, orderId: string): Promise<FoodoraOrder> {
    const options: AxiosRequestConfig = {
      url: `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/orders/${orderId}`,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${foodoraToken}`,
      },
    };

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

  private extractId(token: string, type: TokenType): string {
    try {
      this.logger.debug(`Attempting to extract ${type} ID from token: ${this.maskToken(token)}`);

      if (!token) {
        this.logger.error('Token is empty or undefined');
        throw new Error('Token is required');
      }

      const config = TOKEN_CONFIGS[type];
      const parts = token.split(config.separator);

      if (parts.length !== config.expectedParts) {
        this.logger.error(
          `Invalid ${type} token format. Expected ${config.expectedParts} parts, got ${parts.length}`,
        );
        throw new Error(`Invalid Foodora ${type} token format`);
      }

      const extractedId = parts[config.idPosition];
      this.logger.debug(`Successfully extracted ${type} ID: ${extractedId}`);

      return extractedId;
    } catch (error) {
      this.logger.error(`Failed to extract ${type} ID: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  private maskToken(token: string): string {
    if (!token) return 'undefined';
    if (token.length <= 8) return '***';
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
  }

  async submitCatalog(foodoraToken: string, catalogImportDto: any): Promise<void> {
    try {
      const response = await axios.put(
        `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/catalog`,
        catalogImportDto,
        {
          headers: {
            Authorization: `Bearer ${foodoraToken}`,
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

  async getCatalogLogs(foodoraToken: string, chainCode: string, vendorId: number): Promise<void> {
    try {
      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${chainCode}/vendors/${vendorId}/menu-import-logs?limit=5`,
        {
          headers: {
            Authorization: `Bearer ${foodoraToken}`,
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
    const vendorId = providerInfo.id;

    // Get Foodora credentials
    const foodoraCredentials = await this.getFoodoraCredentials(vendorId, 'Order');

    // Login to Foodora system
    const foodoraToken = await this.foodoraLogin(foodoraCredentials);

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
      await this.handleStatusUpdate(foodoraToken, order, orderData.orderStatus, preparationTime);

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
    foodoraToken: string,
    order: any,
    newStatus: OrderStatusEnum,
    preparationTime: string,
  ): Promise<void> {
    switch (newStatus) {
      case OrderStatusEnum.IN_PROGRESS:
        await this.updateFoodoraOrderStatus(foodoraToken, order.orderId, {
          acceptanceTime: preparationTime,
          remoteOrderId: order.orderId.split('-_-')[1],
          status: FoodoraOrderStatus.Accepted,
        });
        break;

      case OrderStatusEnum.COMPLETED:
        if (order.deliveryType === OrderingDeliveryType.Delivery) {
          await this.markFoodoraOrderAsPrepared(foodoraToken, order.orderId);
        }
        break;

      case OrderStatusEnum.DELIVERED:
        if (order.deliveryType === OrderingDeliveryType.PickUp) {
          await this.updateFoodoraOrderStatus(foodoraToken, order.orderId, {
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
    const vendorId = providerInfo.id;

    const existingOrder = await this.prismaService.order.findUnique({
      where: {
        id: Number(orderId),
      },
    });

    // Get Foodora credentials
    const foodoraCredentials = await this.getFoodoraCredentials(vendorId, 'Order');

    // Login to Foodora system
    const foodoraToken = await this.foodoraLogin(foodoraCredentials);

    try {
      await this.updateFoodoraOrderStatus(foodoraToken, existingOrder.orderId, {
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

    const result = await this.submitCatalog('', mappedMenu);
    return mappedMenu;
  }
}
