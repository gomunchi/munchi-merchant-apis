import { Module } from '@nestjs/common';
import { OrderTrackingService } from './order-tracking.service';
import { OrderTrackingController } from './order-tracking.controller';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [ProviderModule],
  providers: [OrderTrackingService],
  controllers: [OrderTrackingController],
})
export class OrderTrackingModule {}
