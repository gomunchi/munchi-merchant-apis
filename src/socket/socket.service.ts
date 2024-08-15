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
    retries = 3,
    retryDelay = 1000,
  }: EmitOptions & { retries?: number; retryDelay?: number }): Promise<BaseAcknowledgement> {
    let attemptCount = 0;

    const emit = async (): Promise<BaseAcknowledgement> => {
      attemptCount++;
      this.logger.log(`Attempt ${attemptCount} to emit ${event} for order ${data.orderNumber}`);

      const sockets = await this.server.in(room).fetchSockets();
      if (sockets.length === 0) {
        this.logger.warn(`No clients connected to room ${room}. Notification will not be sent.`);
        return this.createDefaultAcknowledgement(
          acknowledgementType,
          data,
          false,
          'No clients in room',
        );
      }

      return new Promise<BaseAcknowledgement>((resolve, reject) => {
        this.server
          .timeout(timeout)
          .to(room)
          .emit(event, data, (err: Error, ack: BaseAcknowledgement[]) => {
            if (err) {
              this.logger.error(
                `Timeout error in ${event} for order ${data.orderNumber}: ${err.message}`,
              );
              reject(err);
            } else if (ack && ack.length > 0 && ack[0].received) {
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
    };

    const retryWithDelay = async (delay: number): Promise<BaseAcknowledgement> => {
      await new Promise((resolve) => setTimeout(resolve, delay));
      return emit();
    };

    try {
      let result = await emit();
      while (!result.received && attemptCount < retries) {
        this.logger.warn(
          `Retrying ${event} for order ${data.orderNumber}. Attempt ${
            attemptCount + 1
          } of ${retries}`,
        );
        result = await retryWithDelay(retryDelay * attemptCount); // Exponential backoff
      }
      return result;
    } catch (error) {
      this.logger.error(
        `Final error in ${event} for order ${data.orderNumber} after ${attemptCount} attempts: ${error}`,
      );
      return this.createDefaultAcknowledgement(acknowledgementType, data, false, 'error');
    }
  }

  private createDefaultAcknowledgement(
    type: AcknowledgementType,
    data: any,
    received: boolean,
    message: string,
  ): BaseAcknowledgement {
    return {
      type,
      received,
      orderNumber: data.orderNumber,
      business: data.business?.name,
      message,
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

  async remindPreOrder({ businessPublicId, orderId, provider }: PreorderQueue): Promise<boolean> {
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
      return true;
    } else {
      this.logger.warn(
        `No acknowledgement received for preorder reminder of order ${order.orderNumber}`,
      );
      return true;
    }
  }

  public async getOrder(
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
