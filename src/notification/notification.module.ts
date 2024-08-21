import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from 'src/auth/auth.module';
import { SessionService } from 'src/auth/session.service';
import { BusinessModule } from 'src/business/business.module';
import { OneSignalService } from 'src/onesignal/onesignal.service';
import { ProviderModule } from 'src/provider/provider.module';
import { UserModule } from 'src/user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationService } from './notification.service';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => BusinessModule),
    AuthModule,
    UserModule,
    ProviderModule,
    JwtModule,
  ],
  providers: [NotificationService, OneSignalService, SessionService],
  exports: [NotificationService],
})
export class NotificationModule {}
