import { Module, forwardRef } from '@nestjs/common';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { AuthModule } from 'src/auth/auth.module';
import { ProviderModule } from 'src/provider/provider.module';
import { QueueModule } from 'src/queue/queue.module';
import { UserModule } from 'src/user/user.module';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';
import { ApiKeyStrategy } from 'src/auth/strategy/apiKey.strategy';
import { ApiKeyService } from 'src/auth/apiKey.service';

@Module({
  imports: [ProviderModule, UserModule, AuthModule, forwardRef(() => QueueModule)],
  controllers: [BusinessController],
  providers: [BusinessService, JwtStrategy, ApiKeyStrategy, ApiKeyService],
  exports: [BusinessService],
})
export class BusinessModule {}
