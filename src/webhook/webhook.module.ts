import { Module, forwardRef } from '@nestjs/common';
import { BusinessModule } from 'src/business/business.module';
import { NotificationModule } from 'src/notification/notification.module';
import { ProviderModule } from 'src/provider/provider.module';
import { UtilsModule } from 'src/utils/utils.module';
import { WebhookController } from './webhook.controller.';
import { WebhookService } from './webhook.service';
import { ZapierModule } from 'src/zapier/zapier.module';

@Module({
  imports: [
    forwardRef(() => BusinessModule),
    UtilsModule,
    ZapierModule,
    forwardRef(() => NotificationModule),
    ProviderModule,
    ZapierModule,
  ],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
