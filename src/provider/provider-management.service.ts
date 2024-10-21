import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Business, BusinessProviders, MenuTracking, Prisma, Provider } from '@prisma/client';
import { UtilsService } from 'src/utils/utils.service';
import { AvailableOrderStatus, OrderResponse } from '../order/dto/order.dto';
import { OrderingOrderMapperService } from './ordering/ordering-order-mapper';
import { OrderingService } from './ordering/ordering.service';

import { PrismaService } from 'src/prisma/prisma.service';
import { FoodoraService } from './foodora/foodora.service';
import {
  OrderingCategoryProductExtra,
  OrderingMenuCategory,
} from './ordering/dto/ordering-menu.dto';
import { AvailableProvider, ProviderEnum } from './provider.type';
import { WoltRepositoryService } from './wolt/wolt-repository';
import { WoltService } from './wolt/wolt.service';

@Injectable()
export class ProviderManagmentService {
  constructor(
    private moduleRef: ModuleRef,
    private woltService: WoltService,
    private foodoraService: FoodoraService,
    private woltRepositoryService: WoltRepositoryService,
    private utilService: UtilsService,
    private orderingService: OrderingService,
    private orderingOrderMapperService: OrderingOrderMapperService,
    private prismaService: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}
  private readonly logger = new Logger(ProviderManagmentService.name);

  private getSortingTime(order: OrderResponse): Date {
    const now = new Date();

    // Check for pickupEta first, regardless of order type
    if (order.pickupEta) {
      return new Date(order.pickupEta);
    }

    // For preorders, use preorderTime if pickupEta is not available
    if (order.type === 'preorder' && order.preorder && order.preorder.preorderTime) {
      return new Date(order.preorder.preorderTime);
    }

    // For all order types, check deliveryEta next
    if (order.deliveryEta) {
      return new Date(order.deliveryEta);
    }

    // Fallback to created time, but ensure it's not in the past
    const createdAt = new Date(order.createdAt);
    return createdAt > now ? createdAt : now;
  }

  private sortOrders(orders: OrderResponse[]): OrderResponse[] {
    return orders.sort((a, b) => {
      const timeA = this.getSortingTime(a);
      const timeB = this.getSortingTime(b);
      return timeA.getTime() - timeB.getTime();
    });
  }

  async getOrderByStatus(
    provider: ProviderEnum[],
    status: AvailableOrderStatus[],
    businessOrderingIds: string[],
    { orderingToken }: { orderingToken: string },
  ): Promise<OrderResponse[]> {
    const orderBy: Prisma.OrderOrderByWithRelationInput = { id: 'asc' };
    const allOrders: OrderResponse[] = [];

    // Fetch orders from all specified providers
    if (provider.includes(ProviderEnum.Munchi)) {
      const orderingOrders = await this.fetchOrderingOrders(
        orderingToken,
        status,
        businessOrderingIds,
      );
      allOrders.push(...orderingOrders);
    }

    if (provider.includes(ProviderEnum.Wolt)) {
      const woltOrders = await this.woltService.getOrderByStatus(
        orderingToken,
        status,
        businessOrderingIds,
        orderBy,
      );
      allOrders.push(...woltOrders);
    }

    if (provider.includes(ProviderEnum.Foodora)) {
      const foodoraOrders = await this.foodoraService.getOrderByStatus(
        orderingToken,
        status,
        businessOrderingIds,
        orderBy,
      );
      allOrders.push(...foodoraOrders);
    }

    return this.sortOrders(allOrders);
  }

  private async fetchOrderingOrders(
    orderingToken: string,
    status: AvailableOrderStatus[],
    businessOrderingIds: string[],
  ): Promise<OrderResponse[]> {
    const orderingOrders = await this.orderingService.getOrderByStatus(
      orderingToken,
      status,
      businessOrderingIds,
    );

    return Promise.all(
      orderingOrders.map(async (order) => {
        this.logger.log(
          `Success in retrieving order for ${order.business.name} with status ${order.status}`,
        );
        return this.orderingOrderMapperService.mapOrderToOrderResponse(order);
      }),
    );
  }

  async getOrderById(orderId: string, orderingUserId: number) {
    // TODO: Need to be refactored so can work with other providers in the future
    const woltOrder = await this.woltRepositoryService.getOrderByIdFromDb(orderId);

    if (!woltOrder) {
      const accessToken = await this.utilService.getOrderingAccessToken(orderingUserId);
      const orderingOrder = await this.orderingService.getOrderById(accessToken, orderId);
      const mapToOrderResponse = await this.orderingOrderMapperService.mapOrderToOrderResponse(
        orderingOrder,
      );
      return mapToOrderResponse;
    }

    return woltOrder;
  }

  // TODO: Test update order and reject order after refactor
  async updateOrder(
    provider: AvailableProvider,
    orderingUserId: number,
    orderId: string,
    updateData: {
      orderStatus: AvailableOrderStatus;
      preparedIn: string;
    },
    businesses: unknown,
  ) {
    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      throw new BadRequestException(
        `Something wrong happened: updateOrder() at 108, ${ProviderManagmentService.name}`,
      );
    }

    // Default provider
    if (provider === ProviderEnum.Munchi) {
      return this.orderingService.updateOrder(orderingUserId, orderId, updateData);
    }

    //Check business from order data

    const order = await this.getOrderById(orderId, orderingUserId);

    const { business } = order;

    const filterBusiness = businesses.filter((b) => b.id === business.publicId);
    const filteredProvider = filterBusiness[0].provider.filter((p) => p.name === provider);

    if (provider.length === 0) {
      throw new BadRequestException(
        `Something wrong happened: updateOrder() at 132, ${ProviderManagmentService.name}`,
      );
    }
    // Dynamic provider
    return this.moduleRef
      .get(`${provider}Service`)
      .updateOrder(orderingUserId, orderId, updateData, filteredProvider[0]);
  }

  async rejectOrder(
    provider: AvailableProvider,
    orderId: string,
    orderingUserId: number,
    orderRejectData: {
      reason: string;
    },
    businesses: unknown,
  ) {
    this.eventEmitter.emit('preorderQueue.validate', orderId);

    const order = await this.getOrderById(orderId, orderingUserId);

    if (!businesses || !Array.isArray(businesses) || businesses.length === 0) {
      throw new BadRequestException(
        `Something wrong happened: rejectOrder() at 157, ${ProviderManagmentService.name}`,
      );
    }

    // const { business } = order;

    // const filterBusiness = businesses.filter((b) => b.id === business.publicId);
    // const filteredProvider = filterBusiness[0].provider.filter((p) => p.name === provider);

    return this.moduleRef
      .get(`${provider}Service`)
      .rejectOrder(orderingUserId, orderId, orderRejectData);
  }

  async syncProviderMenu(
    providers: (BusinessProviders & {
      provider: Provider;
    })[],
    orderingMenuData: OrderingMenuCategory[],
    orderingMenuExtraData: OrderingCategoryProductExtra[],
  ) {
    // This will sync other provider menu except Ordering
    if (providers.length > 0) {
      providers.forEach((provider) => {
        return this.moduleRef
          .get(`${provider.provider.name}Service`)
          .syncMenu(provider.providerId, orderingMenuData, orderingMenuExtraData);
      });
    }
  }

  async editProduct(
    providers: Provider[],
    externalProductId: string,
    orderingUserId: number,
    data: unknown,
  ) {
    // Need a service to transform the body data to data that fit with specific provider
    // This will sync other provider menu except Ordering
    // providers.forEach((provider) => {
    //   return this.moduleRef
    //     .get(`${provider.name}Service`)
    //     .editProduct(provider.providerId, externalProductId, orderingUserId, data);
    // });
  }

  async validateProvider(providers: string[] | string): Promise<boolean> {
    const providerArray: string[] = Object.values(ProviderEnum);

    if (typeof providers === 'string') {
      return providerArray.includes(providers);
    }

    return (
      Array.isArray(providers) && providers.every((provider) => providerArray.includes(provider))
    );
  }

  async menuTracking(
    queue: MenuTracking,
    business: Business & {
      provider: (BusinessProviders & {
        provider: Provider;
      })[];
    },
  ) {
    if (!business) {
      throw new ForbiddenException('No business found');
    }

    const orderingApiKey = await this.prismaService.apiKey.findFirst({
      where: {
        name: 'ORDERING_API_KEY',
      },
    });

    const menuData = await this.orderingService.getMenuCategory(
      '',
      business.orderingBusinessId,
      orderingApiKey.value,
    );

    const menuOptionData = await this.orderingService.getProductExtras(
      '',
      business.orderingBusinessId,
      orderingApiKey.value,
    );

    const { provider: providers } = business;

    if (providers.length > 0) {
      this.logger.log(`Synchronizing provider menu data of ${business.name}`);

      await this.syncProviderMenu(business.provider, menuData, menuOptionData);
    }
  }
}
