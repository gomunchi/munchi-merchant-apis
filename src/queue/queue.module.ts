import { Module, forwardRef } from '@nestjs/common';
import { BusinessModule } from 'src/business/business.module';
import { SocketModule } from 'src/socket/socket.module';
import { QueueService } from './queue.service';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [forwardRef(() => BusinessModule), SocketModule, ProviderModule],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
