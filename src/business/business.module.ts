import { Module } from '@nestjs/common';
import { ApiKeyService } from 'src/auth/apiKey.service';
import { AuthModule } from 'src/auth/auth.module';
import { ApiKeyStrategy } from 'src/auth/strategy/apiKey.strategy';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { ProviderModule } from 'src/provider/provider.module';
import { UserModule } from 'src/user/user.module';
import { BusinessController } from './business.controller';
import { BusinessService } from './business.service';

@Module({
  imports: [ProviderModule, UserModule, AuthModule],
  controllers: [BusinessController],
  providers: [BusinessService, JwtStrategy, ApiKeyStrategy, ApiKeyService],
  exports: [BusinessService],
})
export class BusinessModule {}
