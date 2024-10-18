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
  FoodoraOrderPrismaSelectArgs,
  OpenRestaurantDto,
} from './dto/foodora-restaurant-availability.dto';
import { FoodoraOrderStatus, PosAvailabilityState } from './dto/foodora.enum.dto';
import { FoodoraOrderMapperService } from './foodora-order-mapper';
import { FoodoraMenuMapperService } from './foodora-menu-mapper';
import { MunchiMenu } from './dto/munchi-menu.dto';

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
      this.logger.error(
        `Error getting order identifiers for chain ${process.env.MUNCHI_CHAINCODE} with status ${status} and vendorId ${vendorId}`,
        error,
      );
      throw new HttpException('Failed to get order identifiers', HttpStatus.BAD_REQUEST);
    }
  }

  async getOrderDetails(orderId: string): Promise<FoodoraOrder> {
    const accessToken = await this.foodoraLogin();

    try {
      const response = await axios.get(
        `${this.foodoraApiUrl}/v2/chains/${process.env.MUNCHI_CHAINCODE}/orders/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      return response.data;
    } catch (error) {
      this.logger.error(
        `Error getting order details for chain ${process.env.MUNCHI_CHAINCODE} and order ID ${orderId}`,
        error,
      );
      throw new HttpException('Failed to get order details', HttpStatus.BAD_REQUEST);
    }
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

  async getOrderByStatus(
    accessToken: string,
    status: AvailableOrderStatus[],
    businessIds: string[],
  ): Promise<OrderResponse[]> {
    let orderIds = [];
    if (status.includes(OrderStatusEnum.IN_PROGRESS)) {
      const acceptedOrders = await this.getOrdersIds('accepted');
      orderIds = acceptedOrders.orderIdentifiers;
    } else if (status.includes(OrderStatusEnum.REJECTED)) {
      const cancelledOrders = await this.getOrdersIds('cancelled');
      orderIds = cancelledOrders.orderIdentifiers;
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

  async updateOrder(
    orderingUserId: number,
    orderId: string,
    orderData: Omit<OrderData, 'provider'>,
    providerInfo?: Provider,
  ): Promise<OrderingOrder | OrderResponse> {
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

    try {
      if (orderData.orderStatus === OrderStatusEnum.COMPLETED) {
        await this.markFoodoraOrderAsPrepared(orderId);
      } else if (orderData.orderStatus === OrderStatusEnum.REJECTED) {
        await this.rejectOrder(orderingUserId, orderId, { reason: 'Order rejected' }, providerInfo);
      }
    } catch (error) {
      this.logger.error(`Error updating Foodora order ${orderId}`, error);
      throw new HttpException('Failed to update Foodora order', HttpStatus.BAD_REQUEST);
    }

    const order = await this.getOrderDetails(orderId);
    return this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);
  }

  async rejectOrder(
    orderingUserId: number,
    orderId: string,
    orderRejectData: { reason: string },
    providerInfo?: Provider,
  ): Promise<OrderingOrder | OrderResponse> {
    try {
      const response = await this.updateFoodoraOrderStatus(orderId, {
        status: FoodoraOrderStatus.Rejected,
        reason: orderRejectData.reason,
      });
    } catch (error) {
      this.logger.error(`Error rejecting Foodora order ${orderId}`, error);
      throw new HttpException('Failed to reject Foodora order', HttpStatus.BAD_REQUEST);
    }

    const order = await this.getOrderDetails(orderId);
    return this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);
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
