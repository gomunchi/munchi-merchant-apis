import { Logger } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { BusinessService } from 'src/business/business.service';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { AcknowledgementType, BaseAcknowledgement, EmitOptions } from './dto';
import { ProviderEnum } from 'src/provider/provider.type';
import { OrderingOrderMapperService } from 'src/provider/ordering/ordering-order-mapper';
import { OrderingService } from 'src/provider/ordering/ordering.service';
import { WoltRepositoryService } from 'src/provider/wolt/wolt-repository';

export abstract class BaseGateway {
  @WebSocketServer() protected server: Server;
  protected logger: Logger;
  protected activeRooms: Set<string> = new Set();

  constructor(
    protected readonly businessService: BusinessService,
    protected readonly orderingOrderMapperService: OrderingOrderMapperService,
    protected readonly orderingService: OrderingService,
    protected readonly woltRepositoryService: WoltRepositoryService,
    protected readonly errorHandlingService: ErrorHandlingService,
  ) {
    this.logger = new Logger(this.constructor.name);
  }

  protected async handleJoinRooms(
    socket: Socket,
    room: string | string[],
    callback?: (response: any) => void,
  ) {
    const rooms = Array.isArray(room) ? room : [room];
    this.logger.warn(`Attempting to join rooms: ${rooms.join(', ')}`);
    const joinedRooms: string[] = [];
    const errors: string[] = [];

    for (const r of rooms) {
      const business = await this.businessService.findBusinessByPublicId(r);
      if (business) {
        const roomName = business.orderingBusinessId.toString();
        await socket.join(roomName);
        joinedRooms.push(roomName);
        this.activeRooms.add(roomName);
        this.logger.warn(
          `Socket ${socket.id} joined room ${roomName} for business ${business.name}`,
        );
      } else {
        errors.push(`No business found for ${r}`);
        this.logger.error(`No business found for ${r}`);
      }
    }

    this.updateActiveRooms();
    this.logActiveRooms();

    if (callback) {
      callback({
        success: errors.length === 0,
        joinedRooms,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
  }

  protected async handleLeaveRooms(
    socket: Socket,
    room: string | string[],
    callback?: (response: any) => void,
  ) {
    const rooms = Array.isArray(room) ? room : [room];
    this.logger.warn(`Attempting to leave rooms: ${rooms.join(', ')}`);
    const leftRooms: string[] = [];
    const errors: string[] = [];

    for (const r of rooms) {
      const business = await this.businessService.findBusinessByPublicId(r);
      if (business) {
        const roomName = business.orderingBusinessId.toString();
        await socket.leave(roomName);
        leftRooms.push(roomName);
        this.logger.warn(`Socket ${socket.id} left room ${roomName} for business ${business.name}`);
      } else {
        errors.push(`No business found for ${r}`);
        this.logger.error(`No business found for ${r}`);
      }
    }

    this.updateActiveRooms();
    this.logActiveRooms();

    if (callback) {
      callback({
        success: errors.length === 0,
        leftRooms,
        errors: errors.length > 0 ? errors : undefined,
      });
    }
  }

  protected updateActiveRooms() {
    this.activeRooms = new Set(this.server.sockets.adapter.rooms.keys());
    // Remove socket IDs from the set of rooms
    for (const socketId of this.server.sockets.sockets.keys()) {
      this.activeRooms.delete(socketId);
    }
  }

  protected logActiveRooms() {
    this.logger.log(`Current active rooms: ${Array.from(this.activeRooms).join(', ')}`);
    this.logger.log(`Total number of active rooms: ${this.activeRooms.size}`);
  }

  public async emitWithAcknowledgement({
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

  public createDefaultAcknowledgement(
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
