import { Injectable, Logger } from '@nestjs/common';
import { BusinessService } from 'src/business/business.service';
import { OrderingOrderMapperService } from 'src/provider/ordering/ordering-order-mapper';
import { OrderingRepositoryService } from 'src/provider/ordering/ordering-repository';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { OrderingOrderStatus } from 'src/provider/ordering/ordering.type';
import { WoltOrderMapperService } from 'src/provider/wolt/wolt-order-mapper';
import { WoltService } from 'src/provider/wolt/wolt.service';

import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { OrderStatusEnum } from 'src/order/dto/order.dto';
import { FoodoraOrder } from 'src/provider/foodora/dto/foodora-order-response.dto';
import { FoodoraOrderMapperService } from 'src/provider/foodora/foodora-order-mapper';
import { FoodoraWebhookService } from 'src/provider/foodora/foodora-webhook.service';
import { FoodoraService } from 'src/provider/foodora/foodora.service';
import { OrderingOrder } from 'src/provider/ordering/dto/ordering-order.dto';
import { WoltOrderNotification } from 'src/provider/wolt/dto/wolt-order.dto';
import { WoltWebhookService } from 'src/provider/wolt/wolt-webhook';
import { SocketService } from 'src/socket/socket.service';
import { AuthenticatedGateway } from 'src/socket/socket.v2.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private businessService: BusinessService,
    private configService: ConfigService,
    private errorHandlingService: ErrorHandlingService,
    private woltService: WoltService,
    private foodoraService: FoodoraService,
    private woltWebhookService: WoltWebhookService,
    private foodoraWebhookService: FoodoraWebhookService,
    private orderingService: OrderingService,
    private orderingOrderMapperService: OrderingOrderMapperService,
    private orderingRepositoryService: OrderingRepositoryService,
    private woltOrderMapperService: WoltOrderMapperService,
    private foodoraOrderMapperService: FoodoraOrderMapperService,
    private eventEmitter: EventEmitter2,
    private socketService: SocketService,
    private socketV2Service: AuthenticatedGateway,
  ) {}

  async emitUpdateAppState(deviceId: string) {
    this.socketService.emitUpdateAppState(deviceId);
  }

  async newOrderNotification(order: OrderingOrder): Promise<string> {
    const orderingApiKey = await this.configService.get('ORDERING_API_KEY');
    const { result: customer } = await this.orderingService.getUser(
      '',
      order.customer_id,
      orderingApiKey,
    );

    const newOrder: any = {
      ...order,
      customer: {
        ...order.customer,
        phone: customer.cellphone || order.customer.phone,
        cellphone: customer.cellphone || order.customer.cellphone,
      },
    };

    try {
      const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(
        newOrder,
      );
      console.log('🚀 formattedOrder:', JSON.stringify(formattedOrder));

      this.logger.log(
        `Processing new format order notification for order  ${JSON.stringify(formattedOrder)}`,
      );

      await this.orderingRepositoryService.saveOrderingOrder(formattedOrder);

      this.logger.log(`Emitting order register event to business ${order.business.name}`);

      const ackResult = await this.socketService.emitWithAcknowledgement({
        room: order.business_id.toString(),
        event: 'orders_register',
        data: formattedOrder,
        acknowledgementType: 'orders_register',
        timeout: 10000, // 10 seconds
        retries: 3,
        retryDelay: 2000, // 2 seconds, will increase with each retry
      });

      const ackResultV2 = await this.socketV2Service.emitWithAcknowledgement({
        room: order.business_id.toString(),
        event: 'orders_register',
        data: formattedOrder,
        acknowledgementType: 'orders_register',
        timeout: 10000, // 10 seconds
        retries: 3,
        retryDelay: 2000, // 2 seconds, will increase with each retry
      });

      if (ackResult.received || ackResultV2.received) {
        this.logger.log(`Order register event acknowledged: ${ackResult.message}`);
      } else {
        this.logger.warn(
          `No acknowledgement received for order ${order.id} from business ${order.business.name}`,
        );
      }

      if (ackResultV2.received) {
        this.logger.log(
          `Order register event acknowledged with authenticated: ${ackResult.message}`,
        );
      } else {
        this.logger.warn(
          `No acknowledgement received for order ${order.id} from business ${order.business.name}`,
        );
      }

      this.eventEmitter.emit('newOrder.notification', order.business_id.toString(), formattedOrder);

      return 'Order processed and notified successfully';
    } catch (error) {
      this.errorHandlingService.handleError(error, 'newOrderNotification');
    }
  }

  async changeOrderNotification(order: OrderingOrder) {
    if (
      order.status === OrderingOrderStatus.Pending &&
      order.reporting_data.at.hasOwnProperty(`status:${OrderingOrderStatus.Preorder}`)
    ) {
      return;
    } else {
      this.eventEmitter.emit('preorderQueue.validate', order.id.toString());

      await this.orderingService.syncOrderingOrder(order.id.toString());

      try {
        const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(order);
        const ackResult = await this.socketService.emitWithAcknowledgement({
          room: order.business_id.toString(),
          event: 'order_change',
          data: formattedOrder,
          acknowledgementType: 'order_change',
          timeout: 10000, // 10 seconds
          retries: 3,
          retryDelay: 2000, // 2 seconds, will increase with each retry
        });

        const ackResultV2 = await this.socketV2Service.emitWithAcknowledgement({
          room: order.business_id.toString(),
          event: 'order_change',
          data: formattedOrder,
          acknowledgementType: 'order_change',
          timeout: 10000, // 10 seconds
          retries: 3,
          retryDelay: 2000, // 2 seconds, will increase with each retry
        });

        if (ackResult.received || ackResultV2.received) {
          this.logger.log(`Order register event acknowledged: ${ackResult.message}`);
        } else {
          this.logger.warn(
            `No acknowledgement received for order ${formattedOrder.orderNumber} from business ${order.business.name}`,
          );
        }
      } catch (error) {
        this.errorHandlingService.handleError(error, 'changeOrderNotification');
      }
    }
  }

  public async processWoltOrder(woltWebhookdata: WoltOrderNotification) {
    const venueId = woltWebhookdata.order.venue_id;
    const woltCredentials = await this.woltService.getWoltCredentials(venueId, 'order');
    let order = await this.woltService.getOrderById(
      woltCredentials.value,
      woltWebhookdata.order.id,
    );
    const business = await this.businessService.findBusinessByWoltVenueId(venueId);

    if (order.delivery.type === 'homedelivery') {
      order = await this.woltWebhookService.updatePickupTime(order, venueId);
    }

    return { order, venueId, business, woltCredentials };
  }

  async woltOrderNotification(woltWebhookdata: WoltOrderNotification): Promise<string> {
    this.logger.log(`Received Wolt webhook data: ${JSON.stringify(woltWebhookdata)}`);

    try {
      const { order, business, woltCredentials } = await this.processWoltOrder(woltWebhookdata);
      const formattedWoltOrder = await this.woltOrderMapperService.mapOrderToOrderResponse(order);

      if (this.woltWebhookService.isNewOrder(woltWebhookdata)) {
        await this.woltWebhookService.handleNewWoltOrder(formattedWoltOrder, business);
        return 'New order processed';
      }

      await this.woltWebhookService.handleExistingWoltOrder(
        woltWebhookdata,
        formattedWoltOrder,
        woltCredentials.value,
        business,
      );
      return 'Order update processed';
    } catch (error) {
      this.errorHandlingService.handleError(error, 'woltOrderNotification');
    }
  }

  async notifyCheckBusinessStatus(businessPublicId: string) {
    this.socketService.notifyCheckBusinessStatus(businessPublicId);
  }

  public async processFoodoraOrder(foodoraWebhookdata: any, remoteId: string) {
    const orderId = foodoraWebhookdata.token.split('-_-')[1];
    const order: FoodoraOrder = await this.foodoraService.getOrderDetails(orderId);
    const business = await this.businessService.findBusinessByWoltVenueId(
      foodoraWebhookdata.platformRestaurant.id,
    );

    return { order, business };
  }

  async foodoraOrderNotification(
    foodoraWebhookdata: any,
    request: any,
    remoteId: string,
  ): Promise<string> {
    this.logger.log(`Received Foodora webhook data: ${JSON.stringify(foodoraWebhookdata)}`);

    try {
      const { order, business } = await this.processFoodoraOrder(foodoraWebhookdata, remoteId);

      const formattedFoodoraOrder =
        await this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);

      if (formattedFoodoraOrder.status === OrderStatusEnum.PENDING) {
        await this.foodoraWebhookService.handleNewFoodoraOrder(formattedFoodoraOrder, business);
        return 'New order processed';
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'foodoraOrderNotification');
    }

    return 'Failed to process order';
  }
}
