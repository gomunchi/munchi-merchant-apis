import { Global, Module } from '@nestjs/common';
import { BusinessModule } from 'src/business/business.module';
import { ProviderModule } from 'src/provider/provider.module';
import { SocketService } from './socket.service';
import { AuthenticatedGateway } from './socket.v2.service';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { JwtGuard } from 'src/auth/guard/jwt.guard';
import { OrderingGuard } from 'src/auth/guard/ordering.guard';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';

@Global()
@Module({
  imports: [BusinessModule, ProviderModule, UserModule, AuthModule],
  providers: [SocketService, AuthenticatedGateway, JwtStrategy, JwtGuard, OrderingGuard],
  exports: [SocketService],
})
export class SocketModule {}
