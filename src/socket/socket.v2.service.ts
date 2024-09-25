import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BusinessService } from 'src/business/business.service';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';

import { OrderingOrder } from 'src/provider/ordering/dto/ordering-order.dto';
import { OrderingOrderMapperService } from 'src/provider/ordering/ordering-order-mapper';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { WoltRepositoryService } from 'src/provider/wolt/wolt-repository';
import { BaseGateway } from './socket.base.service';

@WebSocketGateway({
  namespace: '/v2',
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
export class AuthenticatedGateway
  extends BaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    protected readonly businessService: BusinessService,
    protected readonly errorHandlingService: ErrorHandlingService,
    protected readonly orderingService: OrderingService,
    protected readonly orderingOrderMapperService: OrderingOrderMapperService,
    protected readonly woltRepositoryService: WoltRepositoryService,
  ) {
    super(
      businessService,
      orderingOrderMapperService,
      orderingService,
      woltRepositoryService,
      errorHandlingService,
    );
  }

  afterInit(server: Server) {
    this.logger.log('Authenticated WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const token = client.handshake.auth.token;

      const userId = client.handshake.auth['x-user-id'];

      if (!token || !userId) {
        this.handleDisconnect(client, 'Missing parameter');
        return false;
      }

      try {
        await this.orderingService.getUser(token, userId);
      } catch (error) {
        this.handleDisconnect(client, 'Authenticate failed, stopping connection');
      }

      this.logger.log(`Authenticated client connected: ${client.id}`);
      return true;
    } catch (error: any) {
      this.handleDisconnect(client, `${error.message}`);
      return false;
    }
  }

  handleDisconnect(client: Socket, reason?: string) {
    // Emit an error event to the client before disconnecting
    if (reason) {
      client.emit('connection_error', { message: reason });
    }

    // Disconnect the client
    client.disconnect(true);
    this.logger.log(`Client disconnected: ${client.id}${reason ? `, Reason: ${reason}` : ''}`);
    // Optionally, you can update active rooms or perform any cleanup here
    // this.updateActiveRooms();
  }

  @SubscribeMessage('join')
  async onJoin(client: Socket, room: string | string[]) {
    await this.handleJoinRooms(client, room);
  }

  @SubscribeMessage('leave')
  async onLeave(client: Socket, room: string | string[]) {
    await this.handleLeaveRooms(client, room);
  }

  @SubscribeMessage('ping')
  async onPing(data: string) {
    this.logger.log(`Event emitted from user ${data}`);
  }

  @SubscribeMessage('order-popup-closed')
  async onOrderPopupclose(orderId: string, businessId: string) {
    this.server.to(businessId).emit('close-order-popup', orderId);
  }

  @SubscribeMessage('order_change')
  async onOrderChange(orderId: string, businessId: string) {
    this.server.to(businessId).emit('close-order-popup', orderId);
  }

  async emitOrderChange(order: OrderingOrder) {
    const formattedOrder = await this.orderingOrderMapperService.mapOrderToOrderResponse(order);
    this.server.to(order.business_id.toString()).emit('order_change', formattedOrder);
  }

  async notifyCheckBusinessStatus(businessPublicId: string) {
    const business = await this.businessService.findBusinessByPublicId(businessPublicId);
    const message = `${business.name} status changed`;
    this.server.to(business.orderingBusinessId).emit('business_status_change', message);
  }

  // Add other authenticated-specific methods as needed
}
