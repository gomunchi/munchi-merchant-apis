import { Module, forwardRef } from '@nestjs/common';
import { QueueService } from './queue.service';
import { BusinessModule } from 'src/business/business.module';
import { WebhookModule } from 'src/webhook/webhook.module';

@Module({
  imports: [forwardRef(() => BusinessModule), forwardRef(() => WebhookModule)],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
