import { Injectable, NotFoundException } from '@nestjs/common';
import { UtilsService } from 'src/utils/utils.service';
import { ProviderEnum } from '../provider.type';
import { OrderingDeliveryType } from '../ordering/ordering.type';
import { PrismaService } from 'src/prisma/prisma.service';
import { FoodoraOrder, FoodoraProduct } from './dto/foodora-order-response.dto';
import { ProductDto } from 'src/order/dto/product.dto';
import {
  AvailableOrderStatus,
  OrderResponse,
  OrderResponsePreOrderStatusEnum,
  OrderStatusEnum,
  PayMethodEnum,
} from 'src/order/dto/order.dto';
import { FoodoraOrderStatus } from './dto/foodora.enum.dto';

@Injectable()
export class FoodoraOrderMapperService {
  constructor(
    private readonly utilsService: UtilsService,
    private readonly prismaService: PrismaService,
  ) {}

  public mapFoodoraProductToProductDto(product: FoodoraProduct): ProductDto {
    return new ProductDto({
      id: product.id,
      name: product.name,
      quantity: Number(product.quantity),
      price: product.paidPrice,
      comment: product.comment,
      options: [],
    });
  }

  public async mapFoodoraOrderToOrderResponse(foodoraOrder: FoodoraOrder): Promise<OrderResponse> {
    const businessData = await this.validateBusinessByVenueId(
      foodoraOrder.order.platformRestaurant.id,
    );

    let deliveryType: number = OrderingDeliveryType.PickUp;

    if (foodoraOrder.order.expeditionType === 'delivery') {
      deliveryType = OrderingDeliveryType.Delivery;
    }

    const products: ProductDto[] =
      foodoraOrder.order.products?.map((foodoraProduct) =>
        this.mapFoodoraProductToProductDto(foodoraProduct),
      ) || [];

    const orderStatusMapping: {
      [key: string]: AvailableOrderStatus;
    } = {
      [FoodoraOrderStatus.Accepted]: OrderStatusEnum.PENDING,
      [FoodoraOrderStatus.Rejected]: OrderStatusEnum.REJECTED,
      [FoodoraOrderStatus.PickedUp]: OrderStatusEnum.COMPLETED,
    };

    const createdAt = this.utilsService.convertTimeToTimeZone(
      foodoraOrder.order.createdAt,
      'Europe/Helsinki',
    );

    const deliveryTime = foodoraOrder.order.delivery?.expectedDeliveryTime
      ? this.utilsService.convertTimeToTimeZone(
          foodoraOrder.order.delivery.expectedDeliveryTime,
          'Europe/Helsinki',
        )
      : null;

    const preOrderTime = foodoraOrder.order.preOrder
      ? this.utilsService.convertTimeToTimeZone(foodoraOrder.order.expiryDate, 'Europe/Helsinki')
      : null;

    const payMethodId =
      foodoraOrder.order.payment?.type === 'online' ? PayMethodEnum.Card : PayMethodEnum.Cash;

    return {
      id: foodoraOrder.order.token,
      provider: ProviderEnum.Foodora,
      orderId: foodoraOrder.order.token,
      orderNumber: foodoraOrder.order.code,
      business: {
        publicId: foodoraOrder.order.platformRestaurant.id,
        name: businessData.business.name,
        logo: businessData.business.logo,
        email: businessData.business.email,
        address: businessData.business.address,
      },
      type: preOrderTime ? 'preorder' as any : 'instant' as any,
      status: orderStatusMapping[foodoraOrder.order.status] || OrderStatusEnum.PENDING,
      deliveryType: deliveryType,
      createdAt: createdAt,
      comment: foodoraOrder.order.comments?.customerComment,
      preparedIn: null,
      preorder:
        foodoraOrder.order.preOrder && preOrderTime
          ? {
              status:
                foodoraOrder.order.status === FoodoraOrderStatus.Accepted
                  ? OrderResponsePreOrderStatusEnum.Waiting
                  : OrderResponsePreOrderStatusEnum.Confirm,
              preorderTime: preOrderTime,
            }
          : null,
      table: null,
      products: products,
      summary: {
        total: foodoraOrder.order.price?.grandTotal,
      },
      deliveryEta: deliveryTime,
      pickupEta: null,
      offers: [],
      lastModified: foodoraOrder.order.createdAt,
      customer: {
        name: foodoraOrder.order.customer?.firstName + ' ' + foodoraOrder.order.customer?.lastName,
        phone: foodoraOrder.order.customer?.mobilePhone,
      },
      payMethodId: null,
    };
  }

  private async validateBusinessByVenueId(foodoraVenueId: string) {
    const business = await this.prismaService.provider.findUnique({
      where: {
        id: foodoraVenueId,
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
