import { Global, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UtilsService } from './utils.service';
import { UserModule } from 'src/user/user.module';
import { ProviderModule } from 'src/provider/provider.module';

@Global()
@Module({
  imports: [AuthModule, UserModule, ProviderModule],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
