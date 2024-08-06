import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderResponse } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WoltOrderPrismaSelectArgs } from './dto/wolt-order.dto';

@Injectable()
export class WoltSyncService {
  constructor(private prismaService: PrismaService) {}

  /**
   * Synchronizes order data from the Wolt server and updates our local database.
   * This function retrieves order information from the Wolt server and ensures that our
   * local database reflects the latest data. It is responsible for handling the synchronization
   * process, updating order details, and maintaining consistency between the external Wolt
   * server and our internal database.
   *
   * @param   {string}  woltOrderId  [It will need wolt order id to retreieve data]
   *
   * @return  {[string]}               [return void]
   */
  async syncWoltOrder(mappedWoltOrder: OrderResponse): Promise<any> {
    const orderUpdateInputAgrs = Prisma.validator<Prisma.OrderUpdateInput>()({
      orderId: mappedWoltOrder.id,
      provider: mappedWoltOrder.provider,
      status: mappedWoltOrder.status,
      deliveryType: mappedWoltOrder.deliveryType,
      createdAt: mappedWoltOrder.createdAt,
      comment: mappedWoltOrder.comment,
      type: mappedWoltOrder.type,
      orderNumber: mappedWoltOrder.orderNumber,
      preorder: mappedWoltOrder.preorder
        ? {
            update: {
              status: mappedWoltOrder.preorder.status,
              preorderTime: mappedWoltOrder.preorder.preorderTime,
            },
          }
        : undefined,

      lastModified: mappedWoltOrder.lastModified,
      deliveryEta: mappedWoltOrder.deliveryEta,
      pickupEta: mappedWoltOrder.pickupEta,
      payMethodId: mappedWoltOrder.payMethodId,
    });

    //Update order in database
    return await this.prismaService.order.update({
      where: {
        orderId: mappedWoltOrder.orderId,
      },
      data: orderUpdateInputAgrs,
      include: WoltOrderPrismaSelectArgs,
    });
  }
}
