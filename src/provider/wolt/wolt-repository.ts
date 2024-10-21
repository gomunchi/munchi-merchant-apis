import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderResponse } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { WoltOrderPrismaSelectArgs } from './dto/wolt-order.dto';

@Injectable()
export class WoltRepositoryService {
  constructor(private readonly prismaService: PrismaService) {}

  /**
   * Retrieves order data from the Wolt server based on the provided webhook data
   * and saves it to the local database.
   *
   * @param   {WoltOrderNotification<OrderResponse>}  woltWebhookdata  The webhook data containing order information from Wolt.
   *
   * @return  {Promise<OrderResponse>}                                 A promise that resolves with the order response after saving to the database.
   */
  async saveWoltOrder(formattedWoltOrder: OrderResponse): Promise<OrderResponse> {
    //Validate if this wolt order was saved before or not
    await this.validateWoltOrder(formattedWoltOrder.id);

    //Save order to database
    await this.saveWoltOrdertoDb(formattedWoltOrder);

    return formattedWoltOrder;
  }

  private async validateWoltOrder(woltOrderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: {
        orderId: woltOrderId,
      },
    });

    if (order) {
      throw new ForbiddenException('Order existed');
    }
  }

  /**
   * Saves a Wolt order to the database using Prisma.
   *
   * @param {OrderResponse} mappedWoltOrder - The Wolt order data mapped to a general response model.
   *
   * @return  {<string>}           A promise that resolves with a string indicating the result of the save operation.
   */
  async saveWoltOrdertoDb(mappedWoltOrder: OrderResponse): Promise<string> {
    const orderData: Prisma.OrderCreateArgs = {
      data: {
        orderId: mappedWoltOrder.id,
        provider: mappedWoltOrder.provider,
        business: {
          connect: {
            publicId: mappedWoltOrder.business.publicId,
          },
        },
        customer: {
          create: {
            name: mappedWoltOrder.customer.name,
            phone: mappedWoltOrder.customer.phone,
          },
        },
        summary: {
          create: {
            total: mappedWoltOrder.summary.total,
          },
        },
        orderNumber: mappedWoltOrder.orderNumber,
        table: mappedWoltOrder.table,
        deliveryEta: mappedWoltOrder.deliveryEta,
        pickupEta: mappedWoltOrder.pickupEta,
        preparedIn: mappedWoltOrder.preparedIn,
        lastModified: mappedWoltOrder.lastModified,
        type: mappedWoltOrder.type,
        payMethodId: mappedWoltOrder.payMethodId,
        status: mappedWoltOrder.status,
        deliveryType: mappedWoltOrder.deliveryType,
        createdAt: mappedWoltOrder.createdAt,
        comment: mappedWoltOrder.comment || undefined,
        preorder: mappedWoltOrder.preorder
          ? {
              create: {
                preorderTime: mappedWoltOrder.preorder.preorderTime,
                status: mappedWoltOrder.preorder.status,
              },
            }
          : undefined,
      },
      include: {
        products: true,
      },
    };

    console.log(orderData.data.business);

    // Save order to database
    const order = await this.prismaService.order.create(orderData);

    // Save products to database
    await Promise.all(
      mappedWoltOrder.products.map(async (product) => {
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
                subOptionId: subOption.id,
                name: subOption.name,
                price: subOption.price,
                quantity: subOption.quantity,
                image: subOption.image,
                position: subOption.position,
              }),
            );
            const optionData: Prisma.OptionUncheckedCreateInput = {
              optionId: option.id,
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

  public async getOrderByIdFromDb(woltOrderId: string) {
    // Validate that woltOrderId is a valid integer
    const parsedId = Number(woltOrderId);
    if (!Number.isInteger(parsedId)) {
      throw new BadRequestException('Invalid order ID: must be an integer');
    }

    const order = await this.prismaService.order.findUnique({
      where: {
        id: parsedId,
      },
      include: WoltOrderPrismaSelectArgs,
    });

    if (!order) {
      return null;
    }

    return order;
  }
}
