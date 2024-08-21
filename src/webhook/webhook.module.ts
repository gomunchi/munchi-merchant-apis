import { Module } from '@nestjs/common';
import { BusinessModule } from 'src/business/business.module';
import { ProviderModule } from 'src/provider/provider.module';
import { SocketModule } from 'src/socket/socket.module';
import { UtilsModule } from 'src/utils/utils.module';
import { ZapierModule } from 'src/zapier/zapier.module';
import { WebhookController } from './webhook.controller.';
import { WebhookService } from './webhook.service';

@Module({
  imports: [BusinessModule, UtilsModule, ZapierModule, SocketModule, ProviderModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
