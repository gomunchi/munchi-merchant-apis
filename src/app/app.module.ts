import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from 'src/auth/auth.module';
import { BusinessModule } from 'src/business/business.module';
import { CmsModule } from 'src/cms/cms.module';
import { OrderModule } from 'src/order/order.module';

import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerModule } from 'nestjs-pino';
import { NotificationModule } from 'src/notification/notification.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ProviderModule } from 'src/provider/provider.module';
import { ReportModule } from 'src/report/report.module';
import { ScheduleModule as CustomScheduleModule } from 'src/schedule/schedule.module';
import { UserModule } from 'src/user/user.module';
import { WebhookModule } from 'src/webhook/webhook.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HistoryModule } from 'src/history/history.module';
import { MenuModule } from 'src/menu/menu.module';
import { ErrorHandlingModule } from 'src/error-handling/error-handling.module';
import { SocketModule } from 'src/socket/socket.module';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
      },
    }),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    ErrorHandlingModule,
    QueueModule,
    CmsModule,
    BusinessModule,
    MenuModule,
    ProviderModule,
    PrismaModule,
    OrderModule,
    UserModule,
    WebhookModule,
    SocketModule,
    AuthModule,
    ReportModule,
    HistoryModule,
    NotificationModule,
    CustomScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
