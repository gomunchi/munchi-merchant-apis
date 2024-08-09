import { Global, Module } from '@nestjs/common';
import { ErrorHandlingService } from './error-handling.service';

@Global()
@Module({
  providers: [ErrorHandlingService],
  exports: [ErrorHandlingService],
})
export class ErrorHandlingModule {}
