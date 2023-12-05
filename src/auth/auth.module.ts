import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserModule } from 'src/user/user.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenStrategy } from './strategy/refreshJwt.strategy';
import { SessionService } from './session.service';
import { ConfigModule } from '@nestjs/config';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [
    JwtModule.register({}),
    forwardRef(() => UserModule),
    forwardRef(() => ProviderModule),
    forwardRef(() => ConfigModule),
  ],
  controllers: [AuthController],
  providers: [AuthService, RefreshTokenStrategy, SessionService],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
