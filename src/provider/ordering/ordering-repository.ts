import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderResponse } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrderingRepositoryService {
  constructor(private prismaService: PrismaService) {}

  async saveOrderingOrderToDb(mappedOrderingOrder: OrderResponse) {
    const orderData: Prisma.OrderCreateArgs = {
      data: {
        orderId: mappedOrderingOrder.id,
        provider: mappedOrderingOrder.provider,
        business: {
          connect: {
            publicId: mappedOrderingOrder.business.publicId,
          },
        },
        customer: {
          create: {
            name: mappedOrderingOrder.customer.name,
            phone: mappedOrderingOrder.customer.phone,
          },
        },
        summary: {
          create: {
            total: mappedOrderingOrder.summary.total,
          },
        },
        orderNumber: mappedOrderingOrder.orderNumber,
        table: mappedOrderingOrder.table,
        deliveryEta: mappedOrderingOrder.deliveryEta,
        pickupEta: mappedOrderingOrder.pickupEta,
        preparedIn: mappedOrderingOrder.preparedIn,
        lastModified: mappedOrderingOrder.lastModified,
        type: mappedOrderingOrder.type,
        payMethodId: mappedOrderingOrder.payMethodId,
        status: mappedOrderingOrder.status,
        deliveryType: mappedOrderingOrder.deliveryType,
        createdAt: mappedOrderingOrder.createdAt,
        comment: mappedOrderingOrder.comment || undefined,
        preorder: mappedOrderingOrder.preorder
          ? {
              create: {
                preorderTime: mappedOrderingOrder.preorder.preorderTime,
                status: mappedOrderingOrder.preorder.status,
              },
            }
          : undefined,
      },
      include: {
        products: true,
      },
    };

    // Save order to database
    const order = await this.prismaService.order.create(orderData);

    await Promise.all(
      mappedOrderingOrder.products.map(async (product) => {
        const data: Prisma.ProductCreateInput = {
          productId: product.id,
          name: product.name,
          comment: product.comment || undefined,
          price: product.price,
          quantity: product.quantity,
          order: {
            connect: {
              orderId: order.orderId,
            },
          },
        };
        const productSaved = await this.prismaService.product.create({
          data,
        });
        // Save product options to database
        await Promise.all(
          product.options.map(async (option) => {
            const subOptions: Prisma.SubOptionCreateManyOptionsInput[] = option.subOptions.map(
              (subOption) => ({
                subOptionId: subOption.id.toString(),
                name: subOption.name,
                price: subOption.price.toString(),
                quantity: subOption.quantity,
                image: subOption.image,
                position: 0,
              }),
            );
            const optionData: Prisma.OptionUncheckedCreateInput = {
              optionId: option.id.toString(),
              name: option.name,
              productId: productSaved.id,
              image: option.image,
              price: option.price,
              subOptions: {
                createMany: {
                  data: subOptions,
                  skipDuplicates: true,
                },
              },
            };

            await this.prismaService.option.create({
              data: optionData,
            });
          }),
        );
      }),
    );

    return 'Save data successfully';
  }

  async saveOrderingOrder(formattedOrderingOrder: OrderResponse) {
    await this.validateOrderingOrder(formattedOrderingOrder.id);

    //Save order to database
    await this.saveOrderingOrderToDb(formattedOrderingOrder);

    return formattedOrderingOrder;
  }

  private async validateOrderingOrder(orderingOrderid: string) {
    const order = await this.prismaService.order.findUnique({
      where: {
        orderId: orderingOrderid,
      },
    });
    if (order) {
      throw new ForbiddenException('Order existed');
    }
  }
}
