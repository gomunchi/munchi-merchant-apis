import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ErrorHandlingService {
  private readonly logger = new Logger(ErrorHandlingService.name);

  constructor(private configService: ConfigService) {}

  handleError(error: unknown, context: string): void {
    if (error instanceof Error) {
      this.logError(context, error.message, error.stack);
    } else if (typeof error === 'string') {
      this.logError(context, error);
    } else {
      this.logError(context, 'An unknown error occurred', JSON.stringify(error));
    }

    this.trackError(context, error);

    if (this.isCriticalError(error)) {
      this.alertOnCriticalError(context, error);
    }
  }

  private logError(context: string, message: string, stack?: string): void {
    this.logger.error(`[${context}] ${message}`, stack);
  }

  private trackError(context: string, error: unknown): void {
    // Implement error tracking logic here
    // For example, you could send the error to a service like Sentry
    this.logger.warn(`Tracking error: [${context}]`, error);
  }

  private isCriticalError(error: unknown): boolean {
    // Implement logic to determine if an error is critical
    // This could be based on error type, message content, or other factors
    return error instanceof Error && error.message.includes('CRITICAL');
  }

  private alertOnCriticalError(context: string, error: unknown): void {
    // Implement alerting logic for critical errors
    // This could involve sending an email, SMS, or notification to a chat service
    this.logger.error(`ALERT: Critical error in [${context}]`, error);
  }

  throwIfCritical(error: unknown, context: string): void {
    this.handleError(error, context);
    if (this.isCriticalError(error)) {
      throw error;
    }
  }
}
