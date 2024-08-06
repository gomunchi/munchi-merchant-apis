import { Module } from '@nestjs/common';
import { ReportController } from './report.controller';
import { NotificationModule } from '../notification/notification.module'; // Adjust the import path based on your file structure
import { SessionService } from 'src/auth/session.service';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';

import { JwtModule } from '@nestjs/jwt';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [NotificationModule, AuthModule, UserModule, ProviderModule, JwtModule],
  controllers: [ReportController],
  providers: [SessionService],
})
export class ReportModule {}
