import { Injectable } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { BusinessService } from 'src/business/business.service';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';

import { OrderingOrder } from 'src/provider/ordering/dto/ordering-order.dto';
import { OrderingOrderMapperService } from 'src/provider/ordering/ordering-order-mapper';
import { OrderingService } from 'src/provider/ordering/ordering.service';
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
// @UseInterceptors(SocketAuthInterceptor)
@Injectable()
export class AuthenticatedGateway
  extends BaseGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    protected readonly businessService: BusinessService,
    protected readonly errorHandlingService: ErrorHandlingService,
    private readonly orderingService: OrderingService,
    private readonly orderingOrderMapperService: OrderingOrderMapperService,
  ) {
    super(businessService, errorHandlingService);
  }

  afterInit(server: Server) {
    this.logger.log('Authenticated WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Authenticated client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Authenticated client disconnected: ${client.id}`);
    this.updateActiveRooms();
  }

  @SubscribeMessage('join')
  async onJoin(client: Socket, room: string | string[]) {
    await this.handleJoinRooms(client, room);
  }

  @SubscribeMessage('leave')
  async onLeave(client: Socket, room: string | string[]) {
    await this.handleLeaveRooms(client, room);
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
