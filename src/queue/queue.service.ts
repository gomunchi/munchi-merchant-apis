import { BadRequestException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import { ActiveStatusQueue, PreorderQueue, Prisma } from '@prisma/client';
import moment from 'moment';
import { BusinessService } from 'src/business/business.service';
import { ErrorHandlingService } from 'src/error-handling/error-handling.service';
import { OrderStatusEnum } from 'src/order/dto/order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderManagmentService } from 'src/provider/provider-management.service';
import { AvailableProvider, ProviderEnum } from 'src/provider/provider.type';
import { SocketService } from 'src/socket/socket.service';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly delayProviderTime: number;
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds
  constructor(
    private readonly prismaService: PrismaService,
    private readonly socketService: SocketService,
    private readonly providerManagementService: ProviderManagmentService,
    private readonly eventEmitter: EventEmitter2,
    private errorHandlingService: ErrorHandlingService,
    @Inject(forwardRef(() => BusinessService)) private businessService: BusinessService,
  ) {
    this.delayProviderTime = 3; //Minutes
  }

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
        const result = await this.retryRemindPreOrder(queue);

        if (result) {
          await this.validatePreorderQueue(queue.providerOrderId);
        }
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'processQueueItem');
    }
  }

  private async retryRemindPreOrder(queue: PreorderQueue, retryCount = 0): Promise<boolean> {
    try {
      const result = await this.socketService.remindPreOrder(queue);
      if (result) {
        return true;
      }

      if (retryCount < this.MAX_RETRIES) {
        this.logger.warn(
          `Retrying preorder reminder for order ${queue.orderNumber}. Attempt ${retryCount + 1}`,
        );
        await new Promise((resolve) => setTimeout(resolve, this.RETRY_DELAY));
        return this.retryRemindPreOrder(queue, retryCount + 1);
      } else {
        this.eventEmitter.emit('preorder.notification', queue.businessPublicId, queue.orderNumber);

        this.eventEmitter.emit('queue.updatePreorder', queue);

        this.logger.error(
          `Failed to send preorder reminder for order ${queue.orderNumber} after ${this.MAX_RETRIES} attempts`,
        );
        return false;
      }
    } catch (error) {
      this.errorHandlingService.handleError(error, 'retryRemindPreOrder');
      return false;
    }
  }

  @OnEvent('queue.updatePreorder')
  async queueUpdatePreorder(queue: PreorderQueue) {
    const business = await this.businessService.findBusinessByPublicIdWithPayload(
      queue.businessPublicId,
      {
        include: {
          provider: {
            include: {
              provider: true,
            },
          },
        },
      },
    );

    const formattedProvider = [
      ...business.provider.map((providerObject) => ({ ...providerObject.provider })),
    ];

    const formatBusiness = {
      ...business,
      id: business.publicId,
      provider: formattedProvider,
    };

    try {
      const order = await this.socketService.getOrder(
        queue.provider as ProviderEnum,
        queue.orderId,
        null,
      );
      if (!order) {
        return;
      }

      await this.providerManagementService.updateOrder(
        queue.provider as ProviderEnum,
        0,
        queue.id.toString(),
        {
          orderStatus: OrderStatusEnum.IN_PROGRESS,
          preparedIn: order.preparedIn ?? 20,
        },
        [formatBusiness],
      );
    } catch (error) {
      this.errorHandlingService.handleError(error, 'validatePreorderQueue');
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
