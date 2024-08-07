import { Global, Module } from '@nestjs/common';
import { BusinessModule } from 'src/business/business.module';
import { SocketService } from './socket.service';
import { ProviderModule } from 'src/provider/provider.module';

@Global()
@Module({
  imports: [BusinessModule, ProviderModule],
  providers: [SocketService],
  exports: [SocketService],
})
export class SocketModule {}
