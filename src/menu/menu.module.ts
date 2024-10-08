import { Module } from '@nestjs/common';
import { MenuService } from './menu.service';
import { MenuController } from './menu.controller';
import { ProviderModule } from 'src/provider/provider.module';
import { JwtStrategy } from 'src/auth/strategy/jwt.strategy';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { BusinessModule } from 'src/business/business.module';
import { MenuDataProcessorService } from './menu-process.service';

@Module({
  imports: [ProviderModule, AuthModule, UserModule, BusinessModule],
  providers: [MenuService, JwtStrategy, MenuDataProcessorService],
  controllers: [MenuController],
})
export class MenuModule {}
