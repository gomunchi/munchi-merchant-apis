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
      `FI${foodoraOrder.platformRestaurant.id}`,
    );

    let deliveryType: number = OrderingDeliveryType.PickUp;

    if (foodoraOrder.expeditionType === 'delivery') {
      deliveryType = OrderingDeliveryType.Delivery;
    }

    const products: ProductDto[] =
      foodoraOrder.products?.map((foodoraProduct) =>
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
      foodoraOrder.createdAt,
      'Europe/Helsinki',
    );

    const deliveryTime = foodoraOrder.delivery?.expectedDeliveryTime
      ? this.utilsService.convertTimeToTimeZone(
          foodoraOrder.delivery.expectedDeliveryTime,
          'Europe/Helsinki',
        )
      : null;

    const preOrderTime = foodoraOrder.preOrder
      ? this.utilsService.convertTimeToTimeZone(foodoraOrder.expiryDate, 'Europe/Helsinki')
      : null;

    const payMethodId =
      foodoraOrder.payment?.type === 'online' ? PayMethodEnum.Card : PayMethodEnum.Cash;

    return {
      id: foodoraOrder.token,
      provider: ProviderEnum.Foodora,
      orderId: foodoraOrder.token,
      orderNumber: foodoraOrder.shortCode,
      business: {
        publicId: businessData.business.publicId,
        name: businessData.business.name,
        logo: businessData.business.logo,
        email: businessData.business.email,
        address: businessData.business.address,
      },
      type: preOrderTime ? ('preorder' as any) : ('instant' as any),
      status: orderStatusMapping[foodoraOrder.status] || OrderStatusEnum.PENDING,
      deliveryType: deliveryType,
      createdAt: createdAt,
      comment: foodoraOrder.comments?.customerComment,
      preparedIn: null,
      preorder:
        foodoraOrder.preOrder && preOrderTime
          ? {
              status:
                foodoraOrder.status === FoodoraOrderStatus.Accepted
                  ? OrderResponsePreOrderStatusEnum.Waiting
                  : OrderResponsePreOrderStatusEnum.Confirm,
              preorderTime: preOrderTime,
            }
          : null,
      table: null,
      products: products,
      summary: {
        total: foodoraOrder.price?.grandTotal,
      },
      deliveryEta: deliveryTime,
      pickupEta: null,
      offers: [],
      lastModified: foodoraOrder.createdAt,
      customer: {
        name: foodoraOrder.customer?.firstName + ' ' + foodoraOrder.customer?.lastName,
        phone: foodoraOrder.customer?.mobilePhone,
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
