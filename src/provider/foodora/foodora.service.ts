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
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderData } from 'src/type';
import { UtilsService } from 'src/utils/utils.service';
import { OrderingDeliveryType } from '../ordering/ordering.type';
import { ProviderService } from '../provider.service';
import { ProviderEnum, ProviderOrder } from '../provider.type';

import { OrderingMenuMapperService } from '../ordering/ordering-menu-mapper';
import { AvailableOrderStatus, OrderResponse, OrderStatusEnum } from 'src/order/dto/order.dto';
import { OrderingOrder } from '../ordering/dto/ordering-order.dto';
import { FoodoraOrder } from './dto/foodora-order-response.dto';
import { CatalogImportDto } from './dto/foodora-menu.dto';
import { GetOrdersIdsResponse, UpdateFoodoraOrderStatusDto } from './dto/foodora-order.dto';
import {
  AvailabilityStatusResponse,
  CloseRestaurantDto,
  OpenRestaurantDto,
} from './dto/foodora-restaurant-availability.dto';
import { FoodoraOrderStatus, PosAvailabilityState } from './dto/foodora.enum.dto';
import { FoodoraOrderMapperService } from './foodora-order-mapper';
import { WoltOrderPrismaSelectArgs } from '../wolt/dto/wolt-order.dto';

@Injectable()
export class FoodoraService implements ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private foodoraApiUrl: string;
  private foodoraUsername: string;
  private foodoraPassword: string;
  private foodoraSecret: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prismaService: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly orderingMenuMapperService: OrderingMenuMapperService,
    private readonly foodoraOrderMapperService: FoodoraOrderMapperService,
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
      await axios.post(`${this.foodoraApiUrl}/v2/order/status/${orderId}`, dto, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      this.logger.error(`Error updating Foodora order status ${orderId}`, error);
      throw new HttpException('Failed to update Foodora order status', HttpStatus.BAD_REQUEST);
    }
  }

  async markFoodoraOrderAsPrepared(orderId: string): Promise<void> {
    const accessToken = await this.foodoraLogin();

    try {
      await axios.post(
        `${this.foodoraApiUrl}/v2/orders/${orderId}/preparation-completed`,
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
    } catch (error) {
      this.logger.error(`Error marking Foodora order ${orderId} as prepared`, error);
      throw new HttpException('Failed to mark Foodora order as prepared', HttpStatus.BAD_REQUEST);
    }
  }

  async getFoodoraAvailabilityStatus(
    chainCode: string,
    posVendorId: string,
  ): Promise<AvailabilityStatusResponse[]> {
    const accessToken = await this.foodoraLogin();

    try {
      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${chainCode}/remoteVendors/${posVendorId}/availability`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting Foodora availability status for ${chainCode}/${posVendorId}`,
        error,
      );
      throw new HttpException('Failed to get Foodora availability status', HttpStatus.BAD_REQUEST);
    }
  }

  async openFoodoraRestaurant(
    chainCode: string,
    posVendorId: string,
    data: OpenRestaurantDto,
  ): Promise<void> {
    const accessToken = await this.foodoraLogin();

    try {
      // TODO - how to chacge only one restaurant's status ???

      // const availabilityStatus: AvailabilityStatusResponse[] =
      //   await this.getFoodoraAvailabilityStatus(chainCode, posVendorId);

      // if (availabilityStatus.availabilityState === PosAvailabilityState.OPEN) {
      //   throw new HttpException('Restaurant is already open', HttpStatus.FORBIDDEN);
      // }
      const { platformKey, platformRestaurantId } = data;
      await axios.put(
        `${this.foodoraApiUrl}/v2/chains/${chainCode}/remoteVendors/${posVendorId}/availability`,
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
      this.logger.error(`Error opening Foodora restaurant for ${chainCode}/${posVendorId}`, error);
      throw new HttpException('Failed to open Foodora restaurant', HttpStatus.BAD_REQUEST);
    }
  }

  async closeFoodoraRestaurant(
    chainCode: string,
    posVendorId: string,
    data: CloseRestaurantDto,
  ): Promise<void> {
    const accessToken = await this.foodoraLogin();

    try {
      // TODO - how to chacge only one restaurant's status ???

      // const availabilityStatus: AvailabilityStatusResponse[] =
      //   await this.getFoodoraAvailabilityStatus(chainCode, posVendorId);

      // if (
      //   availabilityStatus.availabilityState === PosAvailabilityState.CLOSED ||
      //   availabilityStatus.availabilityState === PosAvailabilityState.CLOSED_UNTIL
      // ) {
      //   throw new HttpException('Restaurant is already closed', HttpStatus.FORBIDDEN);
      // }

      const { closedReason, closingMinutes, platformKey, platformRestaurantId } = data;
      await axios.put(
        `${this.foodoraApiUrl}/v2/chains/${chainCode}/remoteVendors/${posVendorId}/availability`,
        {
          availabilityState: PosAvailabilityState.CLOSED_UNTIL,
          closedReason,
          closingMinutes,
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
      this.logger.error(`Error closing Foodora restaurant for ${chainCode}/${posVendorId}`, error);
      throw new HttpException('Failed to close Foodora restaurant', HttpStatus.BAD_REQUEST);
    }
  }

  async getOrdersIds(
    chainCode: string,
    status: 'cancelled' | 'accepted',
    pastNumberOfHours = 24,
    vendorId?: string,
  ): Promise<GetOrdersIdsResponse> {
    const accessToken = await this.foodoraLogin();

    try {
      const queryParams = new URLSearchParams({
        status,
        pastNumberOfHours: pastNumberOfHours.toString(),
        vendorId: vendorId || '', // optional vendorId
      });

      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${chainCode}/orders/ids?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting order identifiers for chain ${chainCode} with status ${status} and vendorId ${vendorId}`,
        error,
      );
      throw new HttpException('Failed to get order identifiers', HttpStatus.BAD_REQUEST);
    }
  }

  async getOrderDetails(chainCode: string, orderId: string): Promise<FoodoraOrder> {
    const accessToken = await this.foodoraLogin();

    try {
      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${chainCode}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting order details for chain ${chainCode} and order ID ${orderId}`,
        error,
      );
      throw new HttpException('Failed to get order details', HttpStatus.BAD_REQUEST);
    }
  }

  async submitCatalog(chainCode: string, catalogImportDto: CatalogImportDto): Promise<void> {
    const accessToken = await this.foodoraLogin();

    try {
      await axios.post(`${this.foodoraApiUrl}/v2/chains/${chainCode}/catalog`, catalogImportDto, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      this.logger.log(`Catalog submitted successfully for chain ${chainCode}`);
    } catch (error) {
      this.logger.error(`Error submitting catalog for chain ${chainCode}`, error);
      throw new HttpException('Failed to submit catalog', HttpStatus.BAD_REQUEST);
    }
  }

  async getOrderById(credentials: string, id: string): Promise<FoodoraOrder> {
    const chainCode = credentials || 'munchi';
    return this.getOrderDetails(chainCode, id);
  }

  async getOrderByStatus(
    accessToken: string,
    status: AvailableOrderStatus[],
    businessIds: string[],
    orderBy?: Prisma.OrderOrderByWithRelationInput,
  ): Promise<any[]> {
    // let orderIds = [];
    // if (status.includes(OrderStatusEnum.IN_PROGRESS)) {
    //   const acceptedOrders = await this.getOrdersIds('munchi', 'accepted');
    //   orderIds = acceptedOrders.orderIdentifiers;
    // } else if (status.includes(OrderStatusEnum.REJECTED)) {
    //   const cancelledOrders = await this.getOrdersIds('munchi', 'cancelled');
    //   orderIds = cancelledOrders.orderIdentifiers;
    // } else {
    //   throw new BadRequestException('Foodora does not support this order status');
    // }

    // const orders = await Promise.all(
    //   orderIds.map(async (orderId) => {
    //     const order = await this.getOrderDetails('munchi', orderId);
    //     return this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);
    //   }),
    // );
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
      include: WoltOrderPrismaSelectArgs,
    });

    return orders;
  }

  async updateOrder(
    orderingUserId: number,
    orderId: string,
    orderData: Omit<OrderData, 'provider'>,
    extraData?: {
      providerInfo?: Provider;
      accessToken?: string;
    },
  ): Promise<OrderingOrder | OrderResponse> {
    const { providerInfo } = extraData;

    // TODO - implement update order for specific business
    if (
      orderData.orderStatus !== OrderStatusEnum.PENDING &&
      orderData.orderStatus !== OrderStatusEnum.REJECTED &&
      orderData.orderStatus !== OrderStatusEnum.COMPLETED
    ) {
      throw new ForbiddenException(
        'Foodora only supports updating order status to accepded, rejected or completed',
      );
    }

    if (orderData.preparedIn || orderData.reason) {
      throw new ForbiddenException('Foodora does not support updating preparedIn or reason');
    }

    if (orderData.orderStatus === OrderStatusEnum.COMPLETED) {
      await this.markFoodoraOrderAsPrepared(orderId);
    } else if (orderData.orderStatus === OrderStatusEnum.REJECTED) {
      await this.rejectOrder(
        orderingUserId,
        orderId,
        { reason: 'Order rejected' },
        {
          providerInfo: providerInfo,
        },
      );
    }

    const order = await this.getOrderDetails('munchi', orderId);
    return this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);
  }

  async rejectOrder(
    orderingUserId: number,
    orderId: string,
    orderRejectData: { reason: string },
    extraData?: {
      providerInfo?: Provider;
      accessToken?: string;
    },
  ): Promise<OrderingOrder | OrderResponse> {
    const response = await this.updateFoodoraOrderStatus(orderId, {
      status: FoodoraOrderStatus.Rejected,
      reason: orderRejectData.reason,
    });

    const order = await this.getOrderDetails('munchi', orderId);
    return this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);
  }
}
