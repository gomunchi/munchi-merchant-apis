import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Business, MenuTracking, Prisma, Provider } from '@prisma/client';
import { UtilsService } from 'src/utils/utils.service';
import { AvailableOrderStatus } from '../order/dto/order.dto';
import { OrderingOrderMapperService } from './ordering/ordering-order-mapper';
import { OrderingService } from './ordering/ordering.service';

import { AvailableProvider, ProviderEnum } from './provider.type';
import { WoltRepositoryService } from './wolt/wolt-repository';
import { WoltService } from './wolt/wolt.service';
import { OrderingOrder } from './ordering/dto/ordering-order.dto';
import {
  OrderingCategoryProductExtra,
  OrderingMenuCategory,
} from './ordering/dto/ordering-menu.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProviderManagmentService {
  constructor(
    private moduleRef: ModuleRef,
    private woltService: WoltService,
    private woltRepositoryService: WoltRepositoryService,
    private utilService: UtilsService,
    private orderingService: OrderingService,
    private orderingOrderMapperService: OrderingOrderMapperService,
    private prismaService: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}
  private readonly logger = new Logger(ProviderManagmentService.name);

  async getOrderByStatus(
    provider: string[],
    status: AvailableOrderStatus[],
    businessOrderingIds: string[],
    { orderingToken }: { orderingToken: string },
  ) {
    //There only 2 case here as the munchi provider should always be active and can't be disabled

    const orderingOrders = await this.orderingService.getOrderByStatus(
      orderingToken,
      status,
      businessOrderingIds,
    );

    const formattedOrderingOrders = await Promise.all(
      orderingOrders.map(async (order: OrderingOrder) => {
        this.logger.log(
          `Success in retrieving order for ${order.business.name} with status ${order.status}`,
        );
        return await this.orderingOrderMapperService.mapOrderToOrderResponse(order);
      }),
    );

    // TODO: Map provider enum to an array then use that array to map to get order from the database. Filter out "Munchi" first as it is not stored in our database
    //If wolt provider included in the body data
    if (provider.includes(ProviderEnum.Wolt)) {
      const orderBy = Prisma.validator<Prisma.OrderOrderByWithRelationInput>()({
        id: 'asc',
      });

      const woltOrders = await this.woltService.getOrderByStatus(
        orderingToken,
        status,
        businessOrderingIds,
        orderBy,
      );

      const allOrders = [...woltOrders, ...formattedOrderingOrders];
      const sortedOrders = allOrders.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });

      return sortedOrders;
    }

    return formattedOrderingOrders;
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
  ) {
    return this.moduleRef
      .get(`${provider}Service`)
      .updateOrder(orderingUserId, orderId, updateData);
  }

  async rejectOrder(
    provider: AvailableProvider,
    orderId: string,
    orderingUserId: number,
    orderRejectData: {
      reason: string;
    },
  ) {
    this.eventEmitter.emit('preorderQueue.validate', parseInt(orderId));

    return this.moduleRef
      .get(`${provider}Service`)
      .rejectOrder(orderingUserId, orderId, orderRejectData);
  }

  async syncProviderMenu(
    providers: Provider[],
    orderingMenuData: OrderingMenuCategory[],
    orderingMenuExtraData: OrderingCategoryProductExtra[],
  ) {
    // This will sync other provider menu except Ordering
    if (providers.length > 0) {
      providers.forEach((provider) => {
        return this.moduleRef
          .get(`${provider.name}Service`)
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

    providers.forEach((provider) => {
      return this.moduleRef
        .get(`${provider.name}Service`)
        .editProduct(provider.providerId, externalProductId, orderingUserId, data);
    });
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
      provider: Provider[];
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

      await this.syncProviderMenu(providers, menuData, menuOptionData);

      await this.prismaService.menuTracking.update({
        where: {
          businessPublicId: business.publicId,
        },
        data: {
          onCooldown: false,
        },
      });
    }
  }
}
