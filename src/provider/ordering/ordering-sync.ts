import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderingOrderMapperService } from './ordering-order-mapper';
import { Prisma } from '@prisma/client';

import { OrderResponse } from 'src/order/dto/order.dto';
import { WoltOrderPrismaSelectArgs } from '../wolt/dto/wolt-order.dto';

@Injectable()
export class OrderingSyncService {
  constructor(
    private prismaService: PrismaService,
    private orderingOrderMapperService: OrderingOrderMapperService,
  ) {}

  async syncOrderingOrder(mappedOrderingOrder: OrderResponse): Promise<any> {
    const orderUpdateInputAgrs = Prisma.validator<Prisma.OrderUpdateInput>()({
      orderId: mappedOrderingOrder.id,
      provider: mappedOrderingOrder.provider,
      status: mappedOrderingOrder.status,
      deliveryType: mappedOrderingOrder.deliveryType,
      createdAt: mappedOrderingOrder.createdAt,
      comment: mappedOrderingOrder.comment,
      type: mappedOrderingOrder.type,
      orderNumber: mappedOrderingOrder.orderNumber,
      preparedIn: mappedOrderingOrder.preparedIn
        ? mappedOrderingOrder.preparedIn.toString()
        : undefined,
      preorder: mappedOrderingOrder.preorder
        ? {
            update: {
              status: mappedOrderingOrder.preorder.status,
              preorderTime: mappedOrderingOrder.preorder.preorderTime,
            },
          }
        : undefined,

      lastModified: mappedOrderingOrder.lastModified,
      deliveryEta: mappedOrderingOrder.deliveryEta,
      pickupEta: mappedOrderingOrder.pickupEta,
      payMethodId: mappedOrderingOrder.payMethodId,
    });

    return await this.prismaService.order.update({
      where: {
        orderId: mappedOrderingOrder.orderId,
      },
      data: orderUpdateInputAgrs,
      include: WoltOrderPrismaSelectArgs,
    });
  }
}
