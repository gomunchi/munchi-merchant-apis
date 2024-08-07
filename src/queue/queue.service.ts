import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { ActiveStatusQueue, PreorderQueue, Prisma } from '@prisma/client';
import moment from 'moment';
import { BusinessService } from 'src/business/business.service';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { AvailableProvider } from 'src/provider/provider.type';
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly socketService: SocketService,
    private errorHandlingService: ErrorHandlingService,
    @Inject(forwardRef(() => BusinessService)) private businessService: BusinessService,
  ) {}

  @OnEvent('upsert_active_status_queue')
  async upsertActiveStatusQueue(
    data: Prisma.ActiveStatusQueueCreateInput,
  ): Promise<ActiveStatusQueue> {
    return this.prismaService.activeStatusQueue.upsert({
      where: {
        businessPublicId: data.businessPublicId,
      },
      create: data,
      update: data,
    });
  }

  @OnEvent('remove_active_status_queue')
  async removeActiveStatusQueue(businessPublicId: string) {
    return this.prismaService.activeStatusQueue.deleteMany({
      where: {
        businessPublicId,
      },
    });
  }

  @Interval(60000) // Make push notification in every mins
  async activeBusinessStatus() {
    // 1. Get queue
    const now = moment.utc();

    const items = await this.prismaService.activeStatusQueue.findMany({
      where: {
        time: {
          lt: now.toDate(),
        },
        processing: false,
      },
      take: 10,
    });

    this.logger.warn(`active queue items: ${items.length}`);

    if (items.length == 0) {
      this.logger.warn('Items is empty, return');
      return;
    }

    const ids = items.map((item) => item.id);

    // Set processing to true to prevent duplicate handling
    await this.prismaService.activeStatusQueue.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        processing: true,
      },
    });

    for (const item of items) {
      const { userPublicId, businessPublicId } = item;
      await this.businessService.setOnlineStatusByPublicId(
        item.provider as AvailableProvider,
        userPublicId,
        businessPublicId,
        true,
      );
      this.socketService.notifyCheckBusinessStatus(businessPublicId);
    }
  }

  @Interval(60000) // Make push notification in every mins
  async remindPreorder() {
    // 1. Get queue
    const now = moment();

    const preorders = await this.prismaService.preorderQueue.findMany({
      where: {
        reminderTime: {
          gt: now.toISOString(),
        },
        processing: false,
      },
      take: 10,
    });
    this.logger.warn(`active queue preorder: ${preorders.length}`);

    if (preorders.length == 0) {
      this.logger.warn('No preorder queue, return');
      return;
    }

    const ids = preorders.map((preorder) => preorder.id);

    // Set processing to true to prevent duplicate handling
    await this.prismaService.preorderQueue.updateMany({
      where: {
        id: {
          in: ids,
        },
      },
      data: {
        processing: true,
      },
    });
  }

  @Interval(60000)
  async processingPreorderReminder() {
    try {
      const processingQueue = await this.prismaService.preorderQueue.findMany({
        where: { processing: true },
      });
      this.logger.log(`Processing queue preorder: ${processingQueue.length}`);

      if (processingQueue.length === 0) {
        this.logger.log('No processed preorders');
        return;
      }

      for (const queue of processingQueue) {
        await this.processQueueItem(queue);
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'processingPreorderReminder');
    }
  }

  private async processQueueItem(queue: PreorderQueue) {
    try {
      const timeDiff = moment(queue.reminderTime).local().diff(moment(), 'minutes');
      this.logger.log(
        `${timeDiff} minutes left to remind order ${queue.orderNumber} at ${queue.reminderTime}`,
      );

      if (timeDiff === 0) {
        this.logger.log(`Time to send reminder for order ${queue.orderNumber}`);
        await this.socketService.remindPreOrder(queue);
        await this.validatePreorderQueue(queue.providerOrderId);
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'processQueueItem');
    }
  }

  @OnEvent('preorderQueue.validate')
  async validatePreorderQueue(orderId: string) {
    try {
      const queue = await this.prismaService.preorderQueue.findUnique({
        where: { providerOrderId: orderId },
      });
      if (queue) {
        await this.prismaService.preorderQueue.delete({
          where: { orderId: queue.orderId },
        });
        this.logger.log(`Preorder queue validated and deleted for order ${orderId}`);
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'validatePreorderQueue');
    }
  }
}
