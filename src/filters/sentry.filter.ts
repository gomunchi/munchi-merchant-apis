import { Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(SentryFilter.name);
  catch(exception: any, host: ArgumentsHost) {
    Sentry.captureException(exception);

    if (exception.message) {
      Sentry.captureMessage(exception.message);
    }

    this.logger.error(exception);

    super.catch(exception, host);
  }
}
