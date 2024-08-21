import { Notification } from '@onesignal/node-onesignal';

export type NotificationProperties = Omit<
  {
    [K in keyof Notification]: Notification[K];
  },
  'app_id'
>;

export enum PushNotificationChannel {
  NEW_MERCHANT_APP_CHANNEL = '80b01df2-41bb-4c44-9471-d373b035cdcd',
}

export enum PushNotificationTemplate {
  OPEN_APP_REMINDER = 'a3e52228-dccf-45c5-8cc3-4b7060197189',
  NEW_ORDER_REMINDER = '85982c26-c935-4d67-b894-8ad3f05632e4',
  PREORDER_REMINDER = ' ac049b01-e7be-4df5-a092-eded75671229',
}
