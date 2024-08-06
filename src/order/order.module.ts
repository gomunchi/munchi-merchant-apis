import { Module } from '@nestjs/common';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';

import { UtilsModule } from 'src/utils/utils.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { BusinessModule } from 'src/business/business.module';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [UtilsModule, ProviderModule, BusinessModule, UserModule, AuthModule],
  controllers: [OrderController],
  providers: [JwtStrategy, OrderService],
  exports: [OrderService],
})
export class OrderModule {}
