import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SocketService } from 'src/socket/socket.service';
import { OrderResponse } from 'src/order/dto/order.dto';
import { FoodoraService } from './foodora.service';
import { WoltRepositoryService } from '../wolt/wolt-repository';

@Injectable()
export class FoodoraWebhookService {
  private readonly logger = new Logger(FoodoraWebhookService.name);
  constructor(
    private foodoraService: FoodoraService,
    private providerRepositoryService: WoltRepositoryService,
    private eventEmitter: EventEmitter2,
    private socketService: SocketService,
  ) {}

  public async handleNewFoodoraOrder(formattedWoltOrder: any, business?: any): Promise<void> {
    await this.providerRepositoryService.saveWoltOrder(formattedWoltOrder);

    const askResult = await this.socketService.emitWithAcknowledgement({
      room: business.orderingBusinessId || '', // none
      event: 'orders_register',
      data: formattedWoltOrder,
      acknowledgementType: 'orders_register',
      timeout: 10000, // 10 seconds
      retries: 3,
      retryDelay: 2000, // 2 seconds, will increase with each retry
    });

    if (askResult.received) {
      this.logger.log(`New Wolt order registered and acknowledged: ${askResult.message}`);
    } else {
      this.logger.warn(
        `No acknowledgement received for new Wolt order ${formattedWoltOrder.orderNumber}`,
      );
    }
    this.eventEmitter.emit(
      'newOrder.notification',
      business.orderingBusinessId || '', // none
      formattedWoltOrder,
    );
  }
}
