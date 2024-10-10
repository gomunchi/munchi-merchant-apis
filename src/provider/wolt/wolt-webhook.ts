import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocketService } from 'src/socket/socket.service';
import { WoltOrderV2 } from './dto/wolt-order-v2.dto';
import { WoltOrderNotification, WoltOrderType } from './dto/wolt-order.dto';
import { WoltRepositoryService } from './wolt-repository';
import { WoltService } from './wolt.service';
import { OrderResponse } from 'src/order/dto/order.dto';
import { WoltWebhookOrderStatus } from './wolt.type';
import { AuthenticatedGateway } from 'src/socket/socket.v2.service';

@Injectable()
export class WoltWebhookService {
  private readonly logger = new Logger(WoltWebhookService.name);
  constructor(
    private woltService: WoltService,
    private woltRepositoryService: WoltRepositoryService,
    private eventEmitter: EventEmitter2,
    private socketService: SocketService,
    private socketV2Service: AuthenticatedGateway,
  ) {}

  public async updatePickupTime(order: WoltOrderV2, venueId: string): Promise<WoltOrderV2> {
    const maxRetries = 10;
    const retryInterval = 500;

    for (let i = 0; i < maxRetries; i++) {
      if (order.pickup_eta !== null) {
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, retryInterval));
      order = await this.woltService.getOrderById(order.id, venueId);
    }

    return order;
  }

  public isNewOrder(woltWebhookdata: WoltOrderNotification): boolean {
    return (
      woltWebhookdata.order.status === WoltWebhookOrderStatus.Created &&
      woltWebhookdata.type === 'order.notification'
    );
  }

  public async handleNewWoltOrder(formattedWoltOrder: any, business: any): Promise<void> {
    await this.woltRepositoryService.saveWoltOrder(formattedWoltOrder);

    const ackResult = await this.socketService.emitWithAcknowledgement({
      room: business.orderingBusinessId,
      event: 'orders_register',
      data: formattedWoltOrder,
      acknowledgementType: 'orders_register',
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 2000, // 2 seconds, will increase with each retry
    });

    const ackResultV2 = await this.socketV2Service.emitWithAcknowledgement({
      room: business.orderingBusinessId,
      event: 'orders_register',
      data: formattedWoltOrder,
      acknowledgementType: 'orders_register',
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 2000, // 2 seconds, will increase with each retry
    });

    if (ackResult.received) {
      this.logger.log(`New Wolt order registered and acknowledged: ${ackResult.message}`);
    } else {
      this.logger.warn(
        `No acknowledgement received for new Wolt order ${formattedWoltOrder.orderNumber}`,
      );
    }

    if (ackResultV2.received) {
      this.logger.log(
        `New Wolt order registered and acknowledged authenticated: ${ackResultV2.message}`,
      );
    } else {
      this.logger.warn(
        `No acknowledgement received for new Wolt order ${formattedWoltOrder.orderNumber}`,
      );
    }

    this.eventEmitter.emit(
      'newOrder.notification',
      business.orderingBusinessId,
      formattedWoltOrder,
    );
  }

  public async handleExistingWoltOrder(
    woltWebhookdata: WoltOrderNotification,
    formattedWoltOrder: OrderResponse,
    woltCredentials: any,
    business: any,
  ): Promise<void> {
    await this.woltService.syncWoltOrder(woltCredentials, woltWebhookdata.order.id);

    if (woltWebhookdata.order.status === WoltWebhookOrderStatus.Delivered) {
      this.logger.log(`Delivered order details: ${JSON.stringify(formattedWoltOrder)}`);
    }

    if (
      woltWebhookdata.order.status === WoltWebhookOrderStatus.Canceled &&
      formattedWoltOrder.type === WoltOrderType.PreOrder
    ) {
      this.eventEmitter.emit('preorderQueue.validate', formattedWoltOrder.orderId);
    }

    const ackResult = await this.socketService.emitWithAcknowledgement({
      room: business.orderingBusinessId,
      event: 'order_change',
      data: formattedWoltOrder,
      acknowledgementType: 'order_change',
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 2000, // 2 seconds, will increase with each retry
    });

    const ackResultV2 = await this.socketV2Service.emitWithAcknowledgement({
      room: business.orderingBusinessId,
      event: 'orders_register',
      data: formattedWoltOrder,
      acknowledgementType: 'orders_register',
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 2000, // 2 seconds, will increase with each retry
    });

    if (ackResult.received) {
      this.logger.log(`Wolt order change acknowledged: ${ackResult.message}`);
    } else {
      this.logger.warn(
        `No acknowledgement received for Wolt order change ${formattedWoltOrder.orderNumber}`,
      );
    }

    if (ackResultV2.received) {
      this.logger.log(`Wolt order change acknowledged: ${ackResultV2.message}`);
    } else {
      this.logger.warn(
        `No acknowledgement received for Wolt order change ${formattedWoltOrder.orderNumber}`,
      );
    }
  }
}
