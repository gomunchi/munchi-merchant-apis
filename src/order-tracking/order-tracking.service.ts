import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import moment from 'moment';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { OrderStatusEnum } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { WoltOrderPrismaSelectArgs } from 'src/provider/wolt/dto/wolt-order.dto';

@Injectable()
export class OrderTrackingService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly orderingService: OrderingService,
    public errorHandlingService: ErrorHandlingService,
  ) {}
  async getOrders(businessId: string) {
    const today = moment().startOf('day').toDate();
    const tomorrow = moment().startOf('day').add(1, 'days').toDate();

    const ordersFindManyArs = Prisma.validator<Prisma.OrderFindManyArgs>()({
      where: {
        status: {
          in: [OrderStatusEnum.PENDING, OrderStatusEnum.IN_PROGRESS, OrderStatusEnum.COMPLETED],
        },
        createdAt: {
          gte: today.toISOString(),
          lt: tomorrow.toISOString(),
        },
        business: {
          orderingBusinessId: businessId,
        },
      },
      include: WoltOrderPrismaSelectArgs,
    });

    try {
      return this.prismaService.order.findMany(ordersFindManyArs);
    } catch (error) {
      this.errorHandlingService.handleError(error, 'getOrders');
    }
  }

  async getOrdersById(access_token: string, orderId: string) {
    let order_id = orderId;

    if (!Number(orderId)) {
      const orderingOrder = await this.orderingService.getOrderById(access_token, orderId);
      order_id = orderingOrder.id.toString();
    }

    const ordersFindUniqueArs = Prisma.validator<Prisma.OrderFindUniqueArgs>()({
      where: {
        orderId: order_id,
      },
      include: WoltOrderPrismaSelectArgs,
    });

    try {
      return this.prismaService.order.findUnique(ordersFindUniqueArs);
    } catch (error) {
      this.errorHandlingService.handleError(error, 'getOrders');
    }
  }
}
