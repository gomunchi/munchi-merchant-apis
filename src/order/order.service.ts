import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BusinessService } from 'src/business/business.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderManagmentService } from 'src/provider/provider-management.service';
import { OrderData } from 'src/type';
import { UtilsService } from 'src/utils/utils.service';
import { AvailableOrderStatus, OrderStatusEnum } from './dto/order.dto';
import { OrderRejectData } from './validation/order.validation';

@Injectable()
export class OrderService {
  constructor(
    private readonly providerManagementService: ProviderManagmentService,
    private readonly utils: UtilsService,
    private readonly businessService: BusinessService,
    private readonly prismaService: PrismaService,
  ) {}

  async getOrderByStatus(
    orderingUserId: number,
    queryData: {
      providers: string[];
      status: AvailableOrderStatus[];
      businessPublicIds: string[];
    },
  ) {
    const validProvider = await this.providerManagementService.validateProvider(
      queryData.providers,
    );
    const validateStatus = await this.validateOrderStatus(queryData.status);
    // If not enough data or data passed in wrong we return error
    if (!validProvider) {
      throw new NotFoundException('Provider not found');
    } else if (!validateStatus) {
      throw new NotFoundException('Status not found');
    }

    const businesses = await this.businessService.findManyBusinessesByPublicId(
      queryData.businessPublicIds,
    );

    //Format business data to array of business ordering ids
    const businessIds = businesses.map((b) => b.orderingBusinessId);

    const accessToken = await this.utils.getOrderingAccessToken(orderingUserId);

    // Get order by filtering provider, status and businessIds
    const order = await this.providerManagementService.getOrderByStatus(
      queryData.providers,
      queryData.status,
      businessIds,
      {
        orderingToken: accessToken,
      },
    );
    return order;
  }

  async getOrderbyId(orderingUserId: number, orderId: string) {
    try {
      return await this.providerManagementService.getOrderById(orderId, orderingUserId);
    } catch (error) {
      this.utils.logError(error);
    }
  }

  async updateOrder(sessionPublicId:string, orderingUserId: number, orderId: string, orderData: OrderData) {

    if (!orderData || Object.values(orderData).some((value) => value === null)) {
      throw new NotFoundException('Not enough data');
    }

    const validProvider = await this.providerManagementService.validateProvider(orderData.provider);

    if (!validProvider) {
      throw new NotFoundException('No provider found');
    }

    const businesses = await this.businessService.getBusinessInSession(sessionPublicId)

    try {
      //Update order base on provider
      const order = await this.providerManagementService.updateOrder(
        orderData.provider,
        orderingUserId,
        orderId,
        {
          orderStatus: orderData.orderStatus,
          preparedIn: orderData.preparedIn,
        },
        businesses
      );

      return order;
    } catch (error) {
      this.utils.logError(error);
    }
  }

  async rejectOrder(sessionPublicId:string, orderingUserId: number, orderId: string, orderRejectData: OrderRejectData) {

    if (!orderRejectData || Object.values(orderRejectData).some((value) => value === null)) {
      throw new NotFoundException('Not enough data');
    }

    const validProvider = await this.providerManagementService.validateProvider(orderRejectData.provider);

    if (!validProvider) {
      throw new NotFoundException('No provider found');
    }

    const businesses = await this.businessService.getBusinessInSession(sessionPublicId)
    
    try {
      return await this.providerManagementService.rejectOrder(
        orderRejectData.provider,
        orderId,
        orderingUserId,
        {
          reason: orderRejectData.reason,
        },
        businesses
      );
    } catch (error) {
      this.utils.logError(error);
    }
  }

  async validateOrderStatus(orderStatus: AvailableOrderStatus[]) {
    const orderStatusArray: string[] = Object.values(OrderStatusEnum);

    return orderStatus.every((element) => orderStatusArray.includes(element));
  }

  async getManyOrderByArgs(orderArgs: Prisma.OrderFindManyArgs) {
    const order = await this.prismaService.order.findMany(orderArgs);

    return order as any[];
  }

  async countTotalOrderByArgs(orderArgs: Prisma.OrderFindManyArgs) {
    // Remove properties not needed for counting
    const orderCountArgs: Prisma.OrderCountArgs = {
      where: orderArgs.where,
    };

    return await this.prismaService.order.count(orderCountArgs);
  }
}
