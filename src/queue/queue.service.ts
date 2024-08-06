import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { ActiveStatusQueue, Prisma } from '@prisma/client';
import moment from 'moment';
import { BusinessService } from 'src/business/business.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { WebhookService } from './../webhook/webhook.service';
import { AvailableProvider } from 'src/provider/provider.type';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly webhookService: WebhookService,
    @Inject(forwardRef(() => BusinessService)) private businessService: BusinessService,
  ) {}

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
      this.webhookService.notifyCheckBusinessStatus(businessPublicId);
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
    const processingQueue = await this.prismaService.preorderQueue.findMany({
      where: {
        processing: true,
      },
    });
    this.logger.warn(`Processing queue preorder: ${processingQueue.length}`);

    if (processingQueue.length === 0) {
      this.logger.warn('No processed preorders');
      return;
    }

    for (const queue of processingQueue) {
      const timeDiff = moment(queue.reminderTime).local().diff(moment(), 'minutes');
      this.logger.warn(
        `${timeDiff} minutes left to remind order ${queue.orderNumber} at ${queue.reminderTime}`,
      );

      if (timeDiff == 0) {
        this.logger.warn(`Time to send reminder for order ${queue.orderNumber}`);
        await this.webhookService.remindPreOrder(queue);
        await this.validatePreorderQueue(queue.orderId);
      }
    }
  }

  @OnEvent('preorderQueue.validate')
  async validatePreorderQueue(orderId: number) {
    const queue = await this.prismaService.preorderQueue.findUnique({
      where: {
        orderId: orderId,
      },
    });
    if (queue) {
      await this.prismaService.preorderQueue.delete({
        where: {
          orderId: queue.orderId,
        },
      });
    }

    return;
  }
}
