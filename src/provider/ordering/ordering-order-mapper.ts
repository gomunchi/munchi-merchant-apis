import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AvailableOrderStatus,
  OrderResponse,
  OrderResponsePreOrderStatusEnum,
  OrderStatusEnum,
} from 'src/order/dto/order.dto';
import {
  OrderingOrderStatus,
  completedStatus,
  deliveredStatus,
  inProgressStatus,
  pendingStatus,
  rejectedStatus,
} from './ordering.type';
import { ProviderEnum } from '../provider.type';

import moment from 'moment';
import { plainToInstance } from 'class-transformer';
import { ProductDto } from 'src/order/dto/product.dto';
import { OfferDto } from 'src/order/dto/offer.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WoltOrderType } from '../wolt/dto/wolt-order.dto';
import { OrderingOrder } from './dto/ordering-order.dto';

@Injectable()
export class OrderingOrderMapperService {
  constructor(private prismaService: PrismaService) {}

  //Transform ordering response to order resposne
  async mapOrderToOrderResponse(orderingOrder: OrderingOrder): Promise<OrderResponse> {
    const preorder: boolean = orderingOrder.reporting_data.at.hasOwnProperty(`status:13`);
    const productDto = plainToInstance(ProductDto, orderingOrder.products);
    const offers = plainToInstance(OfferDto, orderingOrder.offers);
    const orderStatus = this.mapOrderingStatusToOrderStatus(orderingOrder.status) as string;
    const business = await this.validateOrderingBusiness(orderingOrder.business_id.toString());
    const inputFormat = 'YYYY-MM-DD HH:mm:ss';
    let lastModified: string | null = null;
    //Calculate total amount without delivery fee and including the discount
    const total = (
      orderingOrder.summary.total -
      orderingOrder.summary.delivery_price -
      orderingOrder.summary.driver_tip
    ).toFixed(2);

    if ('history' in orderingOrder && orderingOrder.history.length !== 0) {
      lastModified = moment
        .utc(orderingOrder.history[orderingOrder.history.length - 1].updated_at, inputFormat)
        .local()
        .toISOString(true);
    }

    // Assuming the input time is in UTC, convert to local time

    const deliveryDatetime = orderingOrder.delivery_datetime;

    const createdAt = orderingOrder.created_at
      ? moment.utc(orderingOrder.created_at, inputFormat).local().toISOString(true)
      : null;

    return {
      id: orderingOrder.id.toString(),
      orderId: orderingOrder.id.toString(),
      orderNumber: orderingOrder.id.toString(),
      business: {
        logo: business.logo,
        name: business.name,
        publicId: business.publicId,
        address: business.address,
        email: business.email,
      },
      table: orderingOrder.spot_number,
      payMethodId: orderingOrder.paymethod_id,
      type: preorder ? WoltOrderType.PreOrder : WoltOrderType.Instant,
      deliveryType: orderingOrder.delivery_type,
      comment: orderingOrder.comment,
      summary: {
        total: total.toString(), // This should be equal to subtotal as we don't need delivery fee
      },
      customer: {
        name: `${orderingOrder.customer.name} ${orderingOrder.customer.lastname}`,
        phone: orderingOrder.customer.cellphone,
      },
      deliveryEta: deliveryDatetime,
      pickupEta: null,
      lastModified: lastModified,
      provider: ProviderEnum.Munchi,
      status: orderStatus,
      createdAt: createdAt,
      preparedIn: orderingOrder.prepared_in,
      preorder: preorder
        ? {
            status:
              !orderingOrder.prepared_in && orderingOrder.status === OrderingOrderStatus.Preorder
                ? OrderResponsePreOrderStatusEnum.Waiting
                : OrderResponsePreOrderStatusEnum.Confirm,
            preorderTime: deliveryDatetime,
          }
        : null,
      products: productDto,
      offers: offers,
    };
  }

  mapOrderingStatusToOrderStatus(
    orderingStatus?: number,
    orderStatus?: AvailableOrderStatus[],
  ): string | number[] {
    if (orderingStatus !== undefined) {
      const status = {
        [OrderingOrderStatus.Preorder]: OrderStatusEnum.PREORDER,
        [OrderingOrderStatus.Pending]: OrderStatusEnum.PENDING,
        [OrderingOrderStatus.AcceptedByBusiness]: OrderStatusEnum.IN_PROGRESS,
        [OrderingOrderStatus.AcceptedByDriver]: OrderStatusEnum.DRIVER_FOUND,
        [OrderingOrderStatus.PreparationCompleted]: OrderStatusEnum.COMPLETED,
        [OrderingOrderStatus.PickUpCompletedByDriver]: OrderStatusEnum.PICK_UP_COMPLETED_BY_DRIVER,
        [OrderingOrderStatus.DeliveryCompletedByDriver]: OrderStatusEnum.DELIVERED,
        [OrderingOrderStatus.PickupCompletedByCustomer]: OrderStatusEnum.DELIVERED,
      };

      if (rejectedStatus.includes(orderingStatus)) {
        return OrderStatusEnum.REJECTED;
      }

      return status[orderingStatus];
    }

    if (orderStatus !== undefined && orderStatus.length > 0) {
      if (orderStatus.includes(OrderStatusEnum.PENDING)) {
        return pendingStatus as number[];
      } else if (
        orderStatus.includes(OrderStatusEnum.IN_PROGRESS) ||
        orderStatus.includes(OrderStatusEnum.DRIVER_FOUND)
      ) {
        return inProgressStatus as number[];
      } else if (orderStatus.includes(OrderStatusEnum.COMPLETED)) {
        return completedStatus as number[];
      } else if (orderStatus.includes(OrderStatusEnum.DELIVERED)) {
        return deliveredStatus as number[];
      } else {
        return rejectedStatus as number[];
      }
    }
  }

  async validateOrderingBusiness(orderingBusinessId: string) {
    const business = await this.prismaService.business.findUnique({
      where: {
        orderingBusinessId: orderingBusinessId,
      },
    });
    if (!business) {
      throw new NotFoundException('No business found');
    }

    return business;
  }
}
