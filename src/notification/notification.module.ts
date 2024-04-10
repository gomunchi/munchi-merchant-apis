import { Module, forwardRef } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OneSignalService } from 'src/onesignal/onesignal.service';
import { BusinessModule } from 'src/business/business.module';
import { SessionService } from 'src/auth/session.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { WebhookModule } from 'src/webhook/webhook.module';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BusinessModule),
    forwardRef(() => WebhookModule),
    AuthModule,
    UserModule,
    ProviderModule,
    JwtModule,
  ],
  providers: [NotificationService, OneSignalService, SessionService],
  exports: [NotificationService],
})
export class NotificationModule {}
