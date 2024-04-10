import { Injectable, Logger } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import moment from 'moment';
import { PrismaService } from 'src/prisma/prisma.service';
import { UtilsService } from 'src/utils/utils.service';
import { WebhookService } from 'src/webhook/webhook.service';
import { ReminderScheduleBodyData } from './validation/schedule.validation';

@Injectable()
export class ScheduleService {
  private readonly logger = new Logger(ScheduleService.name);
  constructor(
    private readonly prismaService: PrismaService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly webhookService: WebhookService,
    private readonly utisService: UtilsService,
  ) {}

  async setPreOrderReminder({
    reminderTime,
    orderId,
    businessPublicId,
    orderNumber,
    providerOrderId,
    provider,
  }: ReminderScheduleBodyData) {
    //Get order by order Id
    const localReminderTime = moment(reminderTime).local().toISOString(true);

    //Create preorder queue to process

    const preorderQueueData = Prisma.validator<Prisma.PreorderQueueUncheckedCreateInput>()({
      orderId: parseInt(orderId),
      businessPublicId: businessPublicId,
      orderNumber: orderNumber,
      providerOrderId: providerOrderId,
      reminderTime: localReminderTime,
      provider: provider,
    });

    await this.prismaService.preorderQueue.create({
      data: preorderQueueData,
    });

    return {
      message: 'Success',
    };
  }

  isoToCronExpression(isoTime: string): string | null {
    try {
      const date = moment(isoTime);
      const minutes = date.minutes();
      const hours = date.hours();
      const dayOfMonth = date.date();
      const month = date.month(); // Months are 0-based in moment.js

      const dayOfWeek = date.day();

      return `${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;
    } catch (error) {
      console.error('Error converting ISO to cron expression:', error);
      return null;
    }
  }

  async getReminder() {
    const allCrons = this.schedulerRegistry.getCronJobs();

    return allCrons;
  }
}
