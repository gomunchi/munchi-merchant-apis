import { Logger } from '@nestjs/common';

// src/common/retry/retry.interface.ts
export interface RetryConfig {
  attempts?: number;
  delay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
}

export function Retry(config: RetryConfig = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return RetryUtil.retry(() => originalMethod.apply(this, args), config);
    };

    return descriptor;
  };
}

export class RetryUtil {
  private static readonly logger = new Logger(RetryUtil.name);
  private static readonly DEFAULT_CONFIG: Required<RetryConfig> = {
    attempts: 3,
    delay: 1000,
    maxDelay: 5000,
    exponentialBackoff: true,
  };

  static async retry<T>(fn: () => Promise<T>, config: RetryConfig = {}): Promise<T> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    let attemptCount = 0;

    while (true) {
      try {
        return await fn();
      } catch (error: unknown) {
        attemptCount++;

        if (attemptCount >= finalConfig.attempts) {
          throw error;
        }

        this.logger.warn(
          `Attempt ${attemptCount} failed: ${this.getErrorMessage(error)}. Retrying...`,
        );

        const delay = this.calculateDelay(attemptCount, finalConfig);
        await this.wait(delay);
      }
    }
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error occurred';
  }

  private static calculateDelay(attempt: number, config: Required<RetryConfig>): number {
    if (!config.exponentialBackoff) {
      return config.delay;
    }

    const exponentialDelay = config.delay * Math.pow(2, attempt - 1);
    return Math.min(exponentialDelay, config.maxDelay);
  }

  private static wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
