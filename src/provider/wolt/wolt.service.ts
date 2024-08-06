import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Provider } from '@prisma/client';
import axios from 'axios';
import moment from 'moment';
import {
  AvailableOrderStatus,
  OrderResponse,
  OrderResponsePreOrderStatusEnum,
  OrderStatusEnum,
} from 'src/order/dto/order.dto';
import { ProductDto } from 'src/order/dto/product.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderData } from 'src/type';
import { UtilsService } from 'src/utils/utils.service';
import { OrderingDeliveryType } from '../ordering/ordering.type';
import { ProviderService } from '../provider.service';
import { ProviderEnum } from '../provider.type';
import { WoltItem, WoltOrder, WoltOrderPrismaSelectArgs, WoltOrderType } from './wolt.type';

@Injectable()
export class WoltService implements ProviderService {
  private readonly logger = new Logger(ProviderService.name);
  private woltApiUrl: string;

  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private utilsService: UtilsService,
  ) {
    this.woltApiUrl = this.configService.get('WOLT_API_URL');
  }

  async getOrderByStatus(
    accessToken: string,
    status: AvailableOrderStatus[],
    businessIds: string[],
    orderBy?: Prisma.OrderOrderByWithRelationInput,
  ): Promise<any[]> {
    const orders = await this.prismaService.order.findMany({
      where: {
        status: {
          in: status,
        },
        orderingBusinessId: {
          in: businessIds,
        },
      },
      orderBy: orderBy,
      include: WoltOrderPrismaSelectArgs,
    });

    return orders;
  }

  async getApiKeybyVenueId(venueId: string): Promise<string> {
    const businessProvider = await this.prismaService.provider.findUnique({
      where: {
        providerId: venueId,
      },
    });

    if (!businessProvider) {
      throw new NotFoundException('No provider found associated with this venue ID.');
    }

    return businessProvider.apiKey;
  }

  public async getAllOrder() {
    return await this.prismaService.order.findMany({
      orderBy: {
        id: 'desc',
      },
      include: {
        business: true,
        offers: true,
        preorder: true,
        products: {
          include: {
            option: {
              include: {
                subOption: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Asynchronously retrieves Wolt order data from the Wolt server.
   *
   * @param   {string<WoltOrder>}   woltOrdeId  Wolt order id
   *
   * @return  {Promise<WoltOrder>}              A promise that resolves with the Wolt order data from the Wolt server.
   */
  public async getOrderById(woltOrdeId: string, venueId: string): Promise<WoltOrder> {
    const woltVenueApiKey = await this.getApiKeybyVenueId(venueId);

    try {
      const response = await axios.request({
        method: 'GET',
        baseURL: `${this.woltApiUrl}/orders/${woltOrdeId}`,
        headers: {
          'WOLT-API-KEY': woltVenueApiKey,
        },
      });

      return response.data;
    } catch (error) {
      this.utilsService.logError(error);
    }
  }

  async sendWoltUpdateRequest(
    woltOrderId: string,
    endpoint: string,
    orderType: WoltOrderType,
    provider: Provider,
    updateData?: Omit<OrderData, 'provider'>,
  ) {
    const option = {
      method: 'PUT',
      baseURL: `${this.woltApiUrl}/orders/${woltOrderId}/${endpoint}`,
      headers: {
        'WOLT-API-KEY': provider.apiKey,
      },
      data:
        endpoint === 'reject'
          ? {
              reason: updateData.reason
                ? updateData.reason
                : 'Your order has been rejected, please contact the restaurant for more info',
            }
          : endpoint === 'accept' && orderType === WoltOrderType.Instant
          ? {
              adjusted_pickup_time: updateData.preparedIn,
            }
          : null,
    };
    try {
      const response = await axios.request(option);
      return response.data;
    } catch (error: any) {
      this.logger.log(
        `Error when updating wolt Order with order id:${woltOrderId}. Error: ${error}`,
      );
      await this.syncWoltOrder(woltOrderId, provider.providerId);
      throw new ForbiddenException(error);
    }
  }

  /**
   * This service takes a Wolt order ID as input to update the corresponding order.
   * It follows the following steps:
   * 1. Retrieve the order details from the Wolt server using the provided order ID.
   * 2. Check if the retrieved order matches the current order in the local database and meets all conditions.
   * 3. If conditions are met, send a PUT request to the server to update the order.
   * 4. Sync the updated order data with the local database to maintain consistency.
   *
   * @param {string} woltOrderId - The Wolt order ID to identify the order to be updated.
   * @returns {Promise<void>} A promise that resolves when the update and synchronization process is complete.
   * @throws {Error} If any issues occur during the retrieval, validation, or update process.
   */
  public async updateOrder(
    accessToken: string,
    woltOrderId: string,
    { orderStatus, preparedIn }: Omit<OrderData, 'provider'>,
  ): Promise<any> {
    const order = await this.getOrderByIdFromDb(woltOrderId);

    const businessProvider = await this.prismaService.provider.findUnique({
      where: {
        orderingBusinessId: order.orderingBusinessId,
      },
    });

    const updateEndPoint = this.generateWoltUpdateEndPoint(orderStatus, order as any);

    if (orderStatus === OrderStatusEnum.PICK_UP_COMPLETED_BY_DRIVER) {
      return this.updateAndReturn(order, null, orderStatus);
    }

    try {
      const adjustedPickupTime = preparedIn
        ? moment(order.createdAt).add(preparedIn, 'minutes').format()
        : order.pickupEta;

      await this.sendWoltUpdateRequest(
        order.orderId,
        updateEndPoint,
        order.type as WoltOrderType,
        businessProvider,
        {
          orderStatus: OrderStatusEnum.IN_PROGRESS,
          preparedIn: adjustedPickupTime,
        },
      );

      if (
        order.deliveryType === OrderingDeliveryType.Delivery &&
        order.status === OrderStatusEnum.PENDING
      ) {
        const maxRetries = 10;
        const retryInterval = 500;
        const syncPickUpTime = await this.getOrderById(order.orderId, businessProvider.providerId);
        const formattedSyncOrder = await this.mapOrderToOrderResponse(syncPickUpTime);

        const woltOrderMoment = moment(formattedSyncOrder.pickupEta);
        const formattedSyncOrderMoment = moment(order.pickupEta);

        for (let i = 0; i < maxRetries; i++) {
          if (!woltOrderMoment.isSame(formattedSyncOrderMoment, 'millisecond')) {
            break; // Exit loop if pickup_eta is present
          } else {
            await new Promise((resolve) => setTimeout(resolve, retryInterval));
          }
        }

        await this.syncWoltOrder(order.orderId, businessProvider.providerId);
      }

      return this.updateAndReturn(order, preparedIn, orderStatus);
    } catch (error) {
      this.logger.log(`Error when updating order: ${error}`);
      throw new ForbiddenException(error);
    }
  }

  private async updateAndReturn(
    order: any,
    preparedIn: string | null,
    orderStatus: AvailableOrderStatus,
  ): Promise<any> {
    const updatedOrder = await this.updateOrderInDatabase(order, preparedIn, orderStatus);
    return updatedOrder;
  }

  async updateOrderInDatabase(
    order: any,
    preparedIn?: string,
    orderStatus?: AvailableOrderStatus,
  ): Promise<any> {
    const updatedOrder = await this.prismaService.order.update({
      where: {
        orderId: order.orderId,
      },
      data: {
        preparedIn: preparedIn ?? order.preparedIn,
        status: orderStatus,
        preorder: order.preorder
          ? {
              update: {
                preorderTime: order.preorder.preorderTime,
                status: OrderResponsePreOrderStatusEnum.Confirm,
              },
            }
          : undefined,
        lastModified: moment().toISOString(true),
      },
      include: WoltOrderPrismaSelectArgs,
    });

    return updatedOrder;
  }

  public async rejectOrder(
    orderingToken: string,
    orderId: string,
    orderRejectData: {
      reason: string;
    },
  ) {
    const order = await this.getOrderByIdFromDb(orderId);
    const businessProvider = await this.prismaService.provider.findUnique({
      where: {
        orderingBusinessId: order.orderingBusinessId,
      },
    });
    await this.sendWoltUpdateRequest(
      order.orderId,
      'reject',
      order.type as WoltOrderType,
      businessProvider,
      {
        reason: orderRejectData.reason,
        orderStatus: OrderStatusEnum.REJECTED,
        preparedIn: null,
      },
    );

    const updatedOrder = await this.prismaService.order.update({
      where: {
        orderId: order.orderId,
      },
      data: {
        status: OrderStatusEnum.REJECTED,
      },
      include: WoltOrderPrismaSelectArgs,
    });
    return updatedOrder;
  }

  async getWoltBusinessById(woltVenueId: string) {
    const woltVenueApiKey = await this.getApiKeybyVenueId(woltVenueId);

    const option = {
      method: 'GET',
      baseURL: `${this.woltApiUrl}/venues/${woltVenueId}/status`,
      headers: {
        'WOLT-API-KEY': woltVenueApiKey,
      },
    };
    try {
      const response = await axios.request(option);

      return response.data;
    } catch (error: any) {
      // await this.syncWoltBusiness(woltOrderId);
      throw new ForbiddenException(error);
    }
  }

  // TODO: Get api key by business
  async setWoltVenueStatus(woltVenueId: string, status: boolean, time?: string) {
    const woltVenueApiKey = await this.getApiKeybyVenueId(woltVenueId);

    const option = {
      method: 'PATCH',
      baseURL: `${this.woltApiUrl}/venues/${woltVenueId}/online`,
      headers: {
        'WOLT-API-KEY': woltVenueApiKey,
      },
      data: {
        status: status ? 'ONLINE' : 'OFFLINE',
        until: time ? time : null,
      },
    };

    try {
      const response = await axios.request(option);

      return response.data;
    } catch (error: any) {
      // await this.syncWoltBusiness(woltOrderId);
      throw new ForbiddenException(error);
    }
  }

  public mapWoltItemToProductDto(woltItems: WoltItem[]): ProductDto[] {
    return woltItems.map((product) => ({
      id: product.id,
      name: product.name,
      quantity: product.count,
      comment: null,
      price: (product.total_price.amount / 100).toFixed(1), // Convert from cents to euros and round to 1 decimal place
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

  public async mapOrderToOrderResponse(woltOrder: WoltOrder): Promise<OrderResponse> {
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
        total: (woltOrder.price.amount / 100).toFixed(1),
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

  private async validateBusinessByVenueId(woltVenueId: string) {
    const business = await this.prismaService.provider.findUnique({
      where: {
        providerId: woltVenueId,
      },
      select: {
        business: true,
      },
    });

    if (!business) {
      throw new NotFoundException('No business is associated with this id');
    }

    return business;
  }

  public async getOrderByIdFromDb(woltOrderId: string) {
    const order = await this.prismaService.order.findUnique({
      where: {
        id: parseInt(woltOrderId),
      },
      include: WoltOrderPrismaSelectArgs,
    });

    if (!order) {
      return null;
    }
    // const syncOrder = await this.syncWoltOrder(order.orderId);

    return order;
  }

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
  async syncWoltOrder(woltOrderId: string, venueId: string): Promise<any> {
    //Get order from wolt
    const woltOrder = await this.getOrderById(woltOrderId, venueId);
    // Mapp to general order response
    const mappedWoltOrder = await this.mapOrderToOrderResponse(woltOrder);
    //Init prisma validator
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
        orderId: woltOrderId,
      },
      data: orderUpdateInputAgrs,
      include: WoltOrderPrismaSelectArgs,
    });
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
            const subOptions: Prisma.SubOptionCreateManyOptionInput[] = option.subOptions.map(
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
              subOption: {
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

  generateWoltUpdateEndPoint(orderStatus: AvailableOrderStatus, woltOrderFromDb: OrderResponse) {
    if (orderStatus === OrderStatusEnum.PREORDER) {
      return 'confirm-preorder';
    } else if (orderStatus === OrderStatusEnum.IN_PROGRESS) {
      return 'accept';
    } else if (
      orderStatus === OrderStatusEnum.COMPLETED &&
      woltOrderFromDb.status !== OrderStatusEnum.COMPLETED
    ) {
      return 'ready';
    } else if (orderStatus === OrderStatusEnum.DELIVERED) {
      return 'delivered';
    } else if (orderStatus === OrderStatusEnum.REJECTED) {
      return 'reject';
    } else {
      return '';
    }
  }
}
