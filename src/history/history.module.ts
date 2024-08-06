import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { UserModule } from 'src/user/user.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
import { OrderModule } from 'src/order/order.module';
import { FinancialAnalyticsModule } from 'src/financial-analytics/financial-analytics.module';
import { BusinessModule } from 'src/business/business.module';

@Module({
  imports: [AuthModule, UserModule, OrderModule, FinancialAnalyticsModule, BusinessModule],
  providers: [HistoryService, JwtStrategy],
  controllers: [HistoryController],
})
export class HistoryModule {}
