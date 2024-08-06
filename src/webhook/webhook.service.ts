import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  forwardRef,
} from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets/decorators';
import { PreorderQueue } from '@prisma/client';
import { Server } from 'socket.io';
import { BusinessService } from 'src/business/business.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderingOrderMapperService } from 'src/provider/ordering/ordering-order-mapper';
import { OrderingRepositoryService } from 'src/provider/ordering/ordering-repository';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { OrderingOrderStatus } from 'src/provider/ordering/ordering.type';
import { ProviderEnum } from 'src/provider/provider.type';
import { WoltOrderMapperService } from 'src/provider/wolt/wolt-order-mapper';
import { WoltRepositoryService } from 'src/provider/wolt/wolt-repository';
import { WoltService } from 'src/provider/wolt/wolt.service';

import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { OrderingOrder } from 'src/provider/ordering/dto/ordering-order.dto';
import { WoltOrderNotification } from 'src/provider/wolt/dto/wolt-order.dto';
import { UtilsService } from 'src/utils/utils.service';
import { ZapierService } from 'src/zapier/zapier.service';
import { NotificationService } from './../notification/notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  path: '/socket.io',
})
@Injectable()
export class WebhookService implements OnModuleInit {
  private readonly logger = new Logger(WebhookService.name);
  @WebSocketServer() public server: Server;
  constructor(
    @Inject(forwardRef(() => BusinessService)) private businessService: BusinessService,
    private utils: UtilsService,
    private notificationService: NotificationService,
    private errorHandlingService: ErrorHandlingService,
    private woltService: WoltService,
    private orderingService: OrderingService,
    private orderingOrderMapperService: OrderingOrderMapperService,
    private orderingRepositoryService: OrderingRepositoryService,
    private prismaService: PrismaService,
    private woltOrderMapperService: WoltOrderMapperService,
    private zapierService: ZapierService,
    private woltRepositoryService: WoltRepositoryService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    const ioServer = this.server;

    ioServer.on('connection', (socket) => {
      socket.on('join', async (room: string) => {
        this.logger.warn(`Try to join room ${room}`);
        const business = await this.businessService.findBusinessByPublicId(room);
        if (!business) {
          this.logger.error(`No business found for ${room}`);
          // throw new ForbiddenException(403, `No business found for ${room}`);
        } else {
          this.logger.warn(`join ${room} and business is ${business.name}`);
          socket.join(business.orderingBusinessId.toString());
        }
      });

      socket.on('leave', async (room: string) => {
        this.logger.warn(`Try to leave room ${room}`);
        const business = await this.businessService.findBusinessByPublicId(room);
        if (!business) {
          this.logger.error(`No business found for ${room}`);
          //throw new ForbiddenException(403, `No business found for ${room}`);
        } else {
          this.logger.warn(`leave ${room} and business is ${business.name}`);
          socket.leave(business.orderingBusinessId.toString());
        }
      });

      socket.on('ping', async (data: string) => {
        this.logger.log(`Event emiited from user ${data}`);
      });

      /**
       * Notify when new order popup is closed and server emit event
       * back for other apps if avaiable to close the popup for same order
       */
      socket.on('order-popup-closed', async (orderId: string, businessId: string) => {
        this.server.to(businessId).emit('close-order-popup', orderId);
      });
    });
  }

  async emitUpdateAppState(deviceId: string) {
    this.server.emit('update-app-state', deviceId);
  }

  async newOrderNotification(order: OrderingOrder) {
    const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(order);

    //Save order data from ordering webhook
    await this.orderingRepositoryService.saveOrderingOrder(formattedOrder);
    try {
      this.logger.log(`Emit order register to business ${order.business.name}`);
      this.server.to(order.business_id.toString()).emit('orders_register', formattedOrder);
      this.notificationService.sendNewOrderNotification(order.business_id.toString());

      return 'Order sent';
    } catch (error) {
      this.utils.logError(error);
    }
  }

  async changeOrderNotification(order: OrderingOrder) {
    const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(order);
    if (
      order.status === OrderingOrderStatus.Pending &&
      order.reporting_data.at.hasOwnProperty(`status:${OrderingOrderStatus.Preorder}`)
    ) {
      return;
    } else {
      if (
        order.status === OrderingOrderStatus.AcceptedByBusiness &&
        order.reporting_data.at.hasOwnProperty(`status:${OrderingOrderStatus.Preorder}`)
      ) {
        this.eventEmitter.emit('preorderQueue.validate', order.id.toString());
      }

      try {
        this.server.to(order.business_id.toString()).emit('order_change', formattedOrder);
        await this.orderingService.syncOrderingOrder(order.id.toString());
      } catch (error) {
        this.utils.logError(error);
      }
    }
  }

  async woltOrderNotification(woltWebhookdata: WoltOrderNotification) {
    this.logger.log(`latest webhook data by Wolt: ${JSON.stringify(woltWebhookdata)}`);
    const venueId = woltWebhookdata.order.venue_id;
    // Get apiKey by venue id
    const woltCredentials = await this.woltService.getWoltCredentials(venueId, 'order');
    let woltOrder = await this.woltService.getOrderById(
      woltCredentials.value,
      woltWebhookdata.order.id,
    );
    // Find business to get business id for socket to emit
    const business = await this.businessService.findBusinessByWoltVenueId(venueId);

    // Update pick up time. Sometimes Wolt hasn't fully update pick up time
    if (woltOrder.delivery.type === 'homedelivery') {
      const maxRetries = 10;
      const retryInterval = 500;

      for (let i = 0; i < maxRetries; i++) {
        if (woltOrder.pickup_eta !== null) {
          break; // Exit loop if pickup_eta is present
        } else {
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
          woltOrder = await this.woltService.getOrderById(woltWebhookdata.order.id, venueId); // Refetch
        }
      }
    }
    const formattedWoltOrder = await this.woltOrderMapperService.mapOrderToOrderResponse(woltOrder);
    // Common processing for CREATED orders
    if (
      woltWebhookdata.order.status === 'CREATED' &&
      woltWebhookdata.type === 'order.notification'
    ) {
      await this.woltRepositoryService.saveWoltOrder(formattedWoltOrder);
      this.server.to(business.orderingBusinessId).emit('orders_register', formattedWoltOrder);
      this.notificationService.sendNewOrderNotification(business.orderingBusinessId);
      return 'Order sent';
    }

    // Sync order again
    await this.woltService.syncWoltOrder(woltCredentials.value, woltWebhookdata.order.id);

    //Log the last order
    if (woltWebhookdata.order.status === 'DELIVERED') {
      this.logger.log(`latest order: ${JSON.stringify(woltOrder)}`);
    }
    this.server.to(business.orderingBusinessId).emit('order_change', formattedWoltOrder);
  }

  async notifyCheckBusinessStatus(businessPublicId: string) {
    const business = await this.businessService.findBusinessByPublicId(businessPublicId);
    this.logger.warn(`Business status changed: ${business.name}`);
    const message = `${business.name} status changed`;
    this.server.to(business.orderingBusinessId).emit('business_status_change', message);
  }

  async remindPreOrder({ businessPublicId, orderId, provider }: PreorderQueue) {
    try {
      const business = await this.businessService.findBusinessByPublicId(businessPublicId);
      const orderingApiKey = await this.getOrderingApiKey();
      const order = await this.getOrder(provider as ProviderEnum, orderId, orderingApiKey);

      const message = `It's time for you to prepare order ${order.orderNumber}`;
      await this.emitPreorderNotification(business.orderingBusinessId, message, order);

      this.logger.log(
        `Preorder reminder complete for ${business.name} for order ${order.orderNumber}`,
      );
    } catch (error) {
      this.errorHandlingService.handleError(error, 'remindPreOrder');
    }
  }

  private async getOrder(provider: ProviderEnum, orderId: number, orderingApiKey: any) {
    try {
      if (provider === ProviderEnum.Wolt) {
        return await this.woltRepositoryService.getOrderByIdFromDb(orderId.toString());
      } else {
        const orderingOrder = await this.orderingService.getOrderById(
          '',
          orderId.toString(),
          orderingApiKey.value,
        );
        return await this.orderingOrderMapperService.mapOrderToOrderResponse(orderingOrder);
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'getOrder');
      throw error; // Re-throw as this is critical for further operations
    }
  }

  private async emitPreorderNotification(businessId: string, message: string, order: any) {
    try {
      // Assuming you're using socket.io for emit
      this.server.to(businessId).emit('preorder', { message, order });
    } catch (error) {
      this.errorHandlingService.handleError(error, 'emitPreorderNotification');
    }
  }
  private async getOrderingApiKey() {
    try {
      return await this.prismaService.apiKey.findFirst({
        where: { name: 'ORDERING_API_KEY' },
      });
    } catch (error) {
      this.errorHandlingService.handleError(error, 'getOrderingApiKey');
      throw error; // Re-throw as this is critical for further operations
    }
  }
  @OnEvent('zapier.trigger')
  async sendZapierWebhook(order: OrderingOrder) {
    try {
      const result = await this.zapierService.sendWebhook(order);

      this.logger.log(`Zapier webhook sent successfully for order: ${order.id}`);

      return result;
    } catch (error) {
      this.logger.error(`error sendingZapierhook: ${JSON.stringify(error)}`);
      throw new BadRequestException(error);
    }
  }
}
