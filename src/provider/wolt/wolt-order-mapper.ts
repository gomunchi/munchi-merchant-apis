import { Injectable, NotFoundException } from '@nestjs/common';

import { OrderResponse, OrderStatusEnum } from 'src/order/dto/order.dto';
import { ProductDto } from 'src/order/dto/product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilsService } from 'src/utils/utils.service';
import { OrderingDeliveryType } from '../ordering/ordering.type';
import { ProviderEnum } from '../provider.type';
import { WoltItemV2, WoltOrderV2 } from './dto/wolt-order-v2.dto';
import { WoltOrderType } from './dto/wolt-order.dto';

@Injectable()
export class WoltOrderMapperService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly utilsService: UtilsService,
  ) {}

  public mapWoltItemToProductDto(woltItems: WoltItemV2[]): ProductDto[] {
    return woltItems.map((product) => ({
      id: product.id,
      name: product.name,
      quantity: product.count,
      comment: null,
      price: (product.item_price.total.amount / 100).toFixed(1), // Convert from cents to euros and round to 1 decimal place
      options: product.options.map((option) => ({
        id: this.utilsService.generatePublicId(),
        name: option.name,
        image: null,
        price: null,
        subOptions: [
          {
            id: option.id,
            image: null,
            position: 0,
            name: option.value,
            price: (option.price.amount / 100).toFixed(1),
            quantity: option.count,
          },
        ],
      })),
    }));
  }

  public async mapOrderToOrderResponse(woltOrder: WoltOrderV2): Promise<OrderResponse> {
    let deliverytype: number;

    //Find business by venue id
    const businessData = await this.validateBusinessByVenueId(woltOrder.venue.id);

    woltOrder.delivery.type === 'eatin'
      ? (deliverytype = OrderingDeliveryType.EatIn)
      : woltOrder.delivery.type === 'homedelivery'
      ? (deliverytype = OrderingDeliveryType.Delivery)
      : (deliverytype = OrderingDeliveryType.PickUp);

    const products = this.mapWoltItemToProductDto(woltOrder.items);

    const orderStatusMapping = {
      received:
        woltOrder.type === WoltOrderType.Instant
          ? OrderStatusEnum.PENDING
          : OrderStatusEnum.PREORDER,
      fetched:
        woltOrder.type === WoltOrderType.Instant
          ? OrderStatusEnum.PENDING
          : OrderStatusEnum.PREORDER,
      acknowledged:
        woltOrder.type === WoltOrderType.Instant
          ? OrderStatusEnum.PENDING
          : OrderStatusEnum.PREORDER,
      production: OrderStatusEnum.IN_PROGRESS,
      ready: OrderStatusEnum.COMPLETED,
      delivered: OrderStatusEnum.DELIVERED,
      rejected: OrderStatusEnum.REJECTED,
    };

    const createdAt = this.utilsService.convertTimeToTimeZone(
      woltOrder.created_at,
      businessData.business.timeZone,
    );

    const modifiedAt = this.utilsService.convertTimeToTimeZone(
      woltOrder.modified_at,
      businessData.business.timeZone,
    );

    const pickupEta = this.utilsService.convertTimeToTimeZone(
      woltOrder.pickup_eta,
      businessData.business.timeZone,
    );

    const preOrderTime =
      woltOrder.type === WoltOrderType.PreOrder && woltOrder.pre_order !== null
        ? this.utilsService.convertTimeToTimeZone(
            woltOrder.pre_order.preorder_time,
            businessData.business.timeZone,
          )
        : null;

    const deliveryTime = woltOrder.delivery.time
      ? this.utilsService.convertTimeToTimeZone(
          woltOrder.pickup_eta,
          businessData.business.timeZone,
        )
      : null;

    return {
      id: woltOrder.id,
      orderNumber: woltOrder.order_number,
      orderId: woltOrder.id,
      business: {
        logo: businessData.business.logo,
        name: businessData.business.name,
        publicId: businessData.business.publicId,
        address: businessData.business.address,
        email: businessData.business.email,
      },
      table: null,
      payMethodId: null,
      customer: {
        name: woltOrder.consumer_name,
        phone: woltOrder.consumer_phone_number,
      },
      lastModified: modifiedAt,
      type: woltOrder.type,
      deliveryType: deliverytype,
      comment: woltOrder.consumer_comment,
      summary: {
        total: (woltOrder.basket_price.total.amount / 100).toFixed(2), //Convert to euro from cent
      },
      pickupEta: pickupEta,
      deliveryEta: deliveryTime,
      preparedIn: null,
      provider: ProviderEnum.Wolt,
      status: orderStatusMapping[woltOrder.order_status],
      createdAt: createdAt,
      preorder: woltOrder.pre_order
        ? {
            status: woltOrder.pre_order.pre_order_status,
            preorderTime: preOrderTime,
          }
        : null,
      products: products,
      offers: [],
    };
  }

  private async validateBusinessByVenueId(woltVenueId: string) {
    const business = await this.prismaService.provider.findUnique({
      where: {
        id: woltVenueId,
      },
      select: {
        businesses: {
          select: {
            business: true,
          },
        },
      },
    });

    if (!business) {
      throw new NotFoundException('No business is associated with this id');
    }

    return business.businesses[0];
  }
}
