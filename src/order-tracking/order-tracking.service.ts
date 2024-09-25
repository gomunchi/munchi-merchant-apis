import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import moment from 'moment';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { OrderStatusEnum } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WoltOrderPrismaSelectArgs } from 'src/provider/wolt/dto/wolt-order.dto';

@Injectable()
export class OrderTrackingService {
  constructor(
    private readonly prismaService: PrismaService,
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

  async getOrdersById(orderId: string) {
    const ordersFindUniqueArs = Prisma.validator<Prisma.OrderFindUniqueArgs>()({
      where: {
        orderId: orderId,
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
