// notification/notification.service.ts

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Interval } from '@nestjs/schedule';
import moment from 'moment-timezone';
import { SessionService } from 'src/auth/session.service';
import { BusinessService } from 'src/business/business.service';
import { OneSignalService } from 'src/onesignal/onesignal.service';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly onesignal: OneSignalService,
    private readonly sessionService: SessionService,
    @Inject(forwardRef(() => BusinessService)) private businessService: BusinessService,
  ) {}

  @OnEvent('newOrder.notification')
  async sendNewOrderNotification(orderingBusinessId: string) {
    const business = await this.businessService.findBusinessByOrderingId(orderingBusinessId, {
      include: {
        sessions: true,
      },
    });

    this.logger.warn(`Send new order push notification to ${business.name}`);

    if (!business) {
      return;
    }

    const deviceIds = [];
    for (const session of business.sessions) {
      deviceIds.push(session.deviceId);
    }

    this.logger.warn(`Make new order push notification to: ${deviceIds}`);

    if (deviceIds.length > 0) {
      this.onesignal.pushNewOrderNotification([...new Set(deviceIds)]);
    }
  }

  @OnEvent('preorder.notification')
  async sendPreorderNotification(businessPublicId: string, orderNumber: string) {
    try {
      const business = await this.businessService.findBusinessByPublicIdWithPayload(
        businessPublicId,
        {
          include: {
            sessions: true,
          },
        },
      );

      this.logger.warn(`Send preorder reminder push notification to ${business.name}`);

      if (!business) {
        return;
      }

      const deviceIds = [];

      for (const session of business.sessions) {
        deviceIds.push(session.deviceId);
      }

      this.logger.warn(`Make preorder reminder push notification to: ${deviceIds}`);

      if (deviceIds.length > 0) {
        this.onesignal.pushPreorderNotification([...new Set(deviceIds)], orderNumber);
        this.logger.log(`Successfully sent push notifications for order ${orderNumber}`);
      } else {
        this.logger.warn(`No device IDs found for business ${business.name}`);
      }
    } catch (error) {
      this.logger.error(`Failed to send preorder notification: ${error}`);
    }
  }

  @Interval(60000) // Make push notification in every mins
  async createOpenAppPushNotification() {
    this.logger.warn('Send open app push notification');
    // Get all offline session
    const offlineSessions = await this.sessionService.getOfflineSession();

    if (offlineSessions.length == 0) {
      this.logger.warn('Do not need to make any push notification');
      return;
    }

    const sessionIds = offlineSessions.map((session) => session.id);
    this.logger.warn('Checking push notification for session '.concat(JSON.stringify(sessionIds)));

    await this.sessionService.setOpenAppNotificationSending(true, sessionIds);

    const sendingSessionIds = [];
    const deviceIds = [];
    const schedules = {};
    for (const session of offlineSessions) {
      for (const business of session.businesses) {
        const { publicId: businessId } = business;

        let schedule;

        if (!schedules[businessId]) {
          schedule = await this.businessService.getBusinessTodayScheduleById(
            session.user.orderingUserId,
            businessId,
          );
          schedules[businessId] = schedule;
        } else {
          schedule = schedules[businessId];
        }

        this.logger.warn(`Business ${schedule.name} has schedule ${JSON.stringify(schedule)}`);

        // If today is not enabled, do not make push notification
        if (!schedule.today.enabled) {
          this.logger.warn(`Business ${schedule.name} does not enabled for today`);

          return false;
        }

        // Get current time in business timezone
        const now = moment.utc().tz(schedule.timezone);
        this.logger.warn(`Checking Business ${schedule.name} now ${now}`);

        schedule.today.lapses.forEach((lapse) => {
          const openTimeBusinessTimezone = moment
            .utc()
            .tz(schedule.timezone)
            .set({ hour: lapse.open.hour, minute: lapse.open.minute });

          const closeTimeBusinessTimezone = moment
            .utc()
            .tz(schedule.timezone)
            .set({ hour: lapse.close.hour, minute: lapse.close.minute });

          const openTimeDiff = openTimeBusinessTimezone.diff(
            moment.utc().tz(schedule.timezone),
            'minutes',
          );
          const closeTimeDiff = closeTimeBusinessTimezone.diff(
            moment.utc().tz(schedule.timezone),
            'minutes',
          );

          this.logger.warn(
            `Business ${schedule.name} openTimeBusinessTimezone ${openTimeBusinessTimezone} , closeTimeBusinessTimezone ${closeTimeBusinessTimezone}`,
          );

          this.logger.warn(
            `Business ${schedule.name} openTimeDiff ${openTimeDiff} , closeTimeDiff ${closeTimeDiff}`,
          );

          // If current time is inside the business time, we should make push notification
          if (openTimeDiff < 0 && closeTimeDiff > 0) {
            deviceIds.push(session.deviceId);
            sendingSessionIds.push(session.id);
          } else {
            this.logger.warn(`Business ${schedule.name} is not open now`);
          }
        });
      }
    }

    this.logger.warn(`Make push notification to: ${JSON.stringify(deviceIds)}`);

    if (deviceIds.length > 0) {
      this.onesignal.pushOpenAppNotification([...new Set(deviceIds)]);
      await this.sessionService.incrementOpenAppNotificationCount(sendingSessionIds);
    }

    await this.sessionService.setOpenAppNotificationSending(false, sessionIds);
  }
}
