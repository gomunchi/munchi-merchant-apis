import { Module, forwardRef } from '@nestjs/common';
import { BusinessModule } from 'src/business/business.module';
import { UtilsModule } from 'src/utils/utils.module';
import { WebhookController } from './webhook.controller.';
import { WebhookService } from './webhook.service';
import { NotificationModule } from 'src/notification/notification.module';
import { ProviderModule } from 'src/provider/provider.module';
import { QueueModule } from 'src/queue/queue.module';

@Module({
  imports: [
    forwardRef(() => BusinessModule),
    UtilsModule,
    forwardRef(() => NotificationModule),
    ProviderModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
