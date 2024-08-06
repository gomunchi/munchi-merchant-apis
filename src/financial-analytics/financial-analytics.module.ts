import { Module } from '@nestjs/common';
import { FinancialAnalyticsService } from './financial-analytics.service';

@Module({
  imports: [],
  providers: [FinancialAnalyticsService],
  exports: [FinancialAnalyticsService],
})
export class FinancialAnalyticsModule {}
