import { Injectable, Logger } from '@nestjs/common';
import { BusinessService } from 'src/business/business.service';
import { OrderingOrderMapperService } from 'src/provider/ordering/ordering-order-mapper';
import { OrderingRepositoryService } from 'src/provider/ordering/ordering-repository';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { OrderingOrderStatus } from 'src/provider/ordering/ordering.type';
import { WoltOrderMapperService } from 'src/provider/wolt/wolt-order-mapper';
import { WoltService } from 'src/provider/wolt/wolt.service';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { OrderingOrder } from 'src/provider/ordering/dto/ordering-order.dto';
import { WoltOrderNotification } from 'src/provider/wolt/dto/wolt-order.dto';
import { WoltWebhookService } from 'src/provider/wolt/wolt-webhook';
import { SocketService } from 'src/socket/socket.service';
import { UtilsService } from 'src/utils/utils.service';
import { FoodoraService } from 'src/provider/foodora/foodora.service';
import { FoodoraOrderMapperService } from 'src/provider/foodora/foodora-order-mapper';
import { FoodoraOrder } from 'src/provider/foodora/dto/foodora-order-response.dto';
import { OrderStatusEnum } from 'src/order/dto/order.dto';
import { FoodoraWebhookService } from 'src/provider/foodora/foodora-webhook.service';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);
  constructor(
    private businessService: BusinessService,
    private utils: UtilsService,
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
  ) {}

  async emitUpdateAppState(deviceId: string) {
    this.socketService.emitUpdateAppState(deviceId);
  }

  async newOrderNotification(order: OrderingOrder): Promise<string> {
    this.logger.log(`Processing new order notification for order ${order.id}`);

    try {
      const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(order);

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

      if (ackResult.received) {
        this.logger.log(`Order register event acknowledged: ${ackResult.message}`);
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

        if (ackResult.received) {
          this.logger.log(`Order register event acknowledged: ${ackResult.message}`);
        } else {
          this.logger.warn(
            `No acknowledgement received for order ${formattedOrder.orderNumber} from business ${order.business.name}`,
          );
        }
        await this.orderingService.syncOrderingOrder(order.id.toString());
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
      const { order, venueId, business, woltCredentials } = await this.processWoltOrder(
        woltWebhookdata,
      );
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

  public async processFoodoraOrder(foodoraWebhookdata: any) {
    const venueId = foodoraWebhookdata.order.platformRestaurant.id;
    const order: FoodoraOrder = await this.foodoraService.getOrderById(
      'munchi',
      foodoraWebhookdata.order.token,
    );

    const business = await this.businessService.findBusinessByWoltVenueId(venueId);

    return { order, venueId, business };
  }

  async foodoraOrderNotification(foodoraWebhookdata: any, request: any): Promise<string> {
    this.logger.log(`Received Foodora webhook data: ${JSON.stringify(foodoraWebhookdata)}`);
    this.logger.log(`Received Foodora request: ${JSON.stringify(request)}`);

    try {
      const { order } = await this.processFoodoraOrder(foodoraWebhookdata);

      const formattedFoodoraOrder =
        await this.foodoraOrderMapperService.mapFoodoraOrderToOrderResponse(order);

      if (formattedFoodoraOrder.status === OrderStatusEnum.PENDING) {
        await this.foodoraWebhookService.handleNewFoodoraOrder(formattedFoodoraOrder);
        return 'New order processed';
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'foodoraOrderNotification');
    }

    return 'Its just a dummy response for testing purpose';
  }
}
