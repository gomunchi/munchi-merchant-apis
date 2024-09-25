import { Logger } from '@nestjs/common';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

import { BusinessService } from 'src/business/business.service';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';

export abstract class BaseGateway {
  @WebSocketServer() protected server: Server;
  protected logger: Logger;
  protected activeRooms: Set<string> = new Set();

  constructor(
    protected readonly businessService: BusinessService,
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
  // Other shared methods like emitWithAcknowledgement, createDefaultAcknowledgement, etc.
}
