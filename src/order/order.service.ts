import { Injectable, NotFoundException } from '@nestjs/common';
import { BusinessService } from 'src/business/business.service';
import { OrderingService } from 'src/provider/ordering/ordering.service';
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
    const accessToken = await this.utils.getOrderingAccessToken(orderingUserId);
    try {
      return await this.providerManagementService.getOrderById(orderId, {
        orderingToken: accessToken,
      });
    } catch (error) {
      this.utils.logError(error);
    }
  }

  async updateOrder(orderingUserId: number, orderId: string, orderData: OrderData) {
    const accessToken = await this.utils.getOrderingAccessToken(orderingUserId);

    if (!orderData || Object.values(orderData).some((value) => value === null)) {
      throw new NotFoundException('Not enough data');
    }

    const validProvider = await this.providerManagementService.validateProvider(orderData.provider);

    if (!validProvider) {
      throw new NotFoundException('No provider found');
    }

    try {
      //Update order base on provider
      const order = await this.providerManagementService.updateOrder(
        orderData.provider,
        orderId,
        {
          orderStatus: orderData.orderStatus,
          preparedIn: orderData.preparedIn,
        },
        {
          orderingToken: accessToken,
        },
      );

      return order;
    } catch (error) {
      this.utils.logError(error);
    }
  }

  async rejectOrder(orderingUserId: number, orderId: string, orderRejectData: OrderRejectData) {
    const accessToken = await this.utils.getOrderingAccessToken(orderingUserId);

    try {
      return await this.providerManagementService.rejectOrder(
        orderRejectData.provider,
        orderId,
        {
          reason: orderRejectData.reason,
        },
        {
          orderingToken: accessToken,
        },
      );
    } catch (error) {
      this.utils.logError(error);
    }
  }

  async validateOrderStatus(orderStatus: AvailableOrderStatus[]) {
    const orderStatusArray: string[] = Object.values(OrderStatusEnum);

    return orderStatus.every((element) => orderStatusArray.includes(element));
  }
}
