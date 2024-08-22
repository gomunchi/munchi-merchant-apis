import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createConfiguration, DefaultApi, Notification } from '@onesignal/node-onesignal';
import {
  NotificationProperties,
  PushNotificationChannel,
  PushNotificationTemplate,
} from './onesignal.type';
import { OrderResponse } from 'src/order/dto/order.dto';

@Injectable()
export class OneSignalService {
  private readonly client: DefaultApi;
  private readonly logger = new Logger(OneSignalService.name);

  constructor(private readonly configService: ConfigService) {
    const configuration = createConfiguration({
      appKey: this.configService.get<string>('ONE_SIGNAL_APP_ID'),
      authMethods: {
        app_key: {
          tokenProvider: {
            getToken() {
              return configService.get<string>('ONE_SIGNAL_REST_API_TOKEN');
            },
          },
        },
      },
    });

    this.client = new DefaultApi(configuration);
  }

  private createNotification(notificationProperties: NotificationProperties) {
    const notification = new Notification();
    notification.app_id = this.configService.get('ONE_SIGNAL_APP_ID');

    for (const key in notificationProperties) {
      if (!notification.hasOwnProperty(key)) {
        notification[key] = notificationProperties[key];
      }
    }

    return notification;
  }

  async pushOpenAppNotification(playerIds: string[], language = 'en') {
    const notification = this.createNotification({
      include_player_ids: playerIds,
      android_channel_id: PushNotificationChannel.NEW_MERCHANT_APP_CHANNEL,
      template_id: PushNotificationTemplate.OPEN_APP_REMINDER,
    });

    try {
      await this.client.createNotification(notification);
    } catch (error) {
      this.logger.error(`Error creating open app notification to: ${JSON.stringify(playerIds)}`);
      this.logger.error(error);
      throw error;
    }
  }

  async pushPreorderNotification(playerIds: string[], orderNumber: string) {
    const notification = this.createNotification({
      include_player_ids: playerIds,
      android_channel_id: PushNotificationChannel.NEW_MERCHANT_APP_CHANNEL,
      template_id: PushNotificationTemplate.PREORDER_REMINDER,
      data: {
        orderNumber: orderNumber,
      },
    });

    try {
      await this.client.createNotification(notification);
    } catch (error) {
      this.logger.error(`Error creating new order notification to: ${JSON.stringify(playerIds)}`);
      this.logger.error(error);
      throw error;
    }
  }

  async pushNewOrderNotification(playerIds: string[], order?: OrderResponse) {
    const notification = this.createNotification({
      include_player_ids: playerIds,
      android_channel_id: PushNotificationChannel.NEW_MERCHANT_APP_CHANNEL,
      template_id: PushNotificationTemplate.NEW_ORDER_REMINDER,
    });

    // Verify notification object
    if (!notification || typeof notification !== 'object') {
      this.logger.error('Failed to create notification object');
      throw new Error('Notification creation failed');
    }

    // Add order data if provided
    if (order) {
      if (typeof order !== 'object') {
        this.logger.error('Invalid order object');
        throw new Error('Invalid order data');
      }
      notification.data = {
        order: {
          orderId: order.orderId,
          orderNumber: order.orderNumber,
          businessId: order.business.publicId,
        },
      };
    }

    try {
      await this.client.createNotification(notification);

      this.logger.log(`Successfully processed new order notification for order ${order.id}`);
    } catch (error) {
      this.logger.error(`Error creating new order notification to: ${JSON.stringify(playerIds)}`);
      this.logger.error(error);
      throw error;
    }
  }
}
