import { Module } from '@nestjs/common';
import { CmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { ProviderModule } from 'src/provider/provider.module';

@Module({
  imports: [ProviderModule, UserModule, AuthModule],
  controllers: [CmsController],
  providers: [CmsService],
})
export class CmsModule {}
