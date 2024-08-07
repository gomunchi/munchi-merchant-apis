import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { PreorderQueue } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { BusinessService } from 'src/business/business.service';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { OrderingOrder } from 'src/provider/ordering/dto/ordering-order.dto';
import { OrderingOrderMapperService } from 'src/provider/ordering/ordering-order-mapper';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { ProviderEnum } from 'src/provider/provider.type';
import { WoltRepositoryService } from 'src/provider/wolt/wolt-repository';
import { AcknowledgementType, BaseAcknowledgement, EmitOptions } from './dto';

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
export class SocketService implements OnModuleInit {
  private readonly logger = new Logger(SocketService.name);
  @WebSocketServer() public server: Server;
  constructor(
    private readonly businessService: BusinessService,
    private readonly orderingOrderMapperService: OrderingOrderMapperService,
    private readonly orderingService: OrderingService,
    private readonly woltRepositoryService: WoltRepositoryService,
    private readonly errorHandlingService: ErrorHandlingService,
  ) {}
  onModuleInit() {
    if (!this.server) {
      this.logger.error('WebSocket server is not initialized');
      return;
    }

    this.server.on('connection', (socket) => {
      this.handleSocketConnection(socket);
    });
  }

  private handleSocketConnection(socket: any) {
    socket.on('join', async (room: string) => {
      await this.handleJoinRoom(socket, room);
    });

    socket.on('leave', async (room: string) => {
      await this.handleLeaveRoom(socket, room);
    });

    socket.on('ping', async (data: string) => {
      this.logger.log(`Event emitted from user ${data}`);
    });

    socket.on('order-popup-closed', async (orderId: string, businessId: string) => {
      this.server.to(businessId).emit('close-order-popup', orderId);
    });

    socket.on('order_change', (orderId: string, businessId: string) => {
      this.server.to(businessId).emit('close-order-popup', orderId);
    });
  }

  private async handleJoinRoom(socket: Socket, room: string) {
    this.logger.warn(`Attempting to join room ${room}`);
    const business = await this.businessService.findBusinessByPublicId(room);

    if (!business) {
      this.logger.error(`No business found for ${room}`);
      return;
    }

    const roomName = business.orderingBusinessId.toString();
    socket.join(roomName);

    this.logger.warn(`Socket ${socket.id} joined room ${roomName} for business ${business.name}`);

    // Log all rooms this socket has joined
    const joinedRooms = Array.from(socket.rooms.values()).filter((r) => r !== socket.id);
    this.logger.log(`Socket ${socket.id} is now in rooms: ${joinedRooms.join(', ')}`);

    // Optionally, you can emit a confirmation to the client
    socket.emit('roomJoined', { room: roomName, businessName: business.name });
  }

  private async handleLeaveRoom(socket: any, room: string) {
    this.logger.warn(`Try to leave room ${room}`);
    const business = await this.businessService.findBusinessByPublicId(room);
    if (!business) {
      this.logger.error(`No business found for ${room}`);
    } else {
      this.logger.warn(`leave ${room} and business is ${business.name}`);
      socket.leave(business.orderingBusinessId.toString());
    }
  }

  async emitWithAcknowledgement({
    room,
    event,
    data,
    acknowledgementType,
    timeout = 5000,
  }: EmitOptions): Promise<BaseAcknowledgement> {
    return new Promise<BaseAcknowledgement>(async (resolve) => {
      try {
        const sockets = await this.server.in(room).fetchSockets();
        if (sockets.length === 0) {
          this.logger.warn(`No clients connected to room ${room}. Notification will not be sent.`);
          return resolve(
            this.createDefaultAcknowledgement(
              acknowledgementType,
              data,
              false,
              'No clients in room',
            ),
          );
        }

        const timeoutPromise = new Promise<BaseAcknowledgement>((_, reject) => {
          setTimeout(() => {
            reject(
              new Error(
                `Timeout waiting for acknowledgement of ${event} for order ${data.orderNumber}`,
              ),
            );
          }, timeout);
        });

        const emitPromise = new Promise<BaseAcknowledgement>((resolve) => {
          this.server
            .to(room)
            .timeout(timeout)
            .emit(event, data, (error: any, ack: BaseAcknowledgement[]) => {
              if (ack.length > 0 && ack[0].received) {
                this.logger.log(`${event} acknowledged: ${JSON.stringify(ack)}`);
                resolve(ack[0]);
              } else {
                this.logger.warn(
                  `Invalid acknowledgement received for ${event} of order ${data.orderNumber}`,
                );
                resolve(
                  this.createDefaultAcknowledgement(
                    acknowledgementType,
                    data,
                    false,
                    'Invalid acknowledgement',
                  ),
                );
              }
            });
        });

        const result = await Promise.race([emitPromise, timeoutPromise]);
        resolve(result);
      } catch (error) {
        this.logger.error(`Error in ${event} for order ${data.orderNumber}: ${error}`);
        resolve(this.createDefaultAcknowledgement(acknowledgementType, data, false, 'error'));
      }
    });
  }

  private createDefaultAcknowledgement(
    type: AcknowledgementType,
    data: any,
    received: boolean,
    reason: string,
  ): BaseAcknowledgement {
    return {
      type,
      received,
      orderNumber: data.orderNumber,
      business: data.business?.name || 'Unknown',
      message: `${received ? 'Acknowledged' : 'Not acknowledged'}: ${reason} for ${type} of order ${
        data.orderNumber
      }`,
    };
  }

  async emitUpdateAppState(deviceId: string) {
    this.server.emit('update-app-state', deviceId);
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

  async remindPreOrder({ businessPublicId, orderId, provider }: PreorderQueue): Promise<void> {
    const business = await this.businessService.findBusinessByPublicId(businessPublicId);
    const orderingApiKey = await this.orderingService.getOrderingApiKey();
    const order = await this.getOrder(provider as ProviderEnum, orderId, orderingApiKey);
    const message = `It's time for you to prepare order ${order.orderNumber}`;
    const ackResult = await this.emitWithAcknowledgement({
      room: business.orderingBusinessId,
      event: 'preorder',
      data: { message, order },
      acknowledgementType: 'preorder',
    });

    if (ackResult.received) {
      this.logger.log(`Preorder reminder acknowledged: ${ackResult.message}`);
    } else {
      this.logger.warn(
        `No acknowledgement received for preorder reminder of order ${order.orderNumber}`,
      );
    }
  }

  private async getOrder(
    provider: ProviderEnum,
    orderId: number,
    orderingApiKey: any,
  ): Promise<any> {
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
}
