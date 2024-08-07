import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let details = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as any;
      message = exceptionResponse.message || exception.message;
      details = exceptionResponse.details || null;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // If the response has already been sent (e.g., by Sentry), we don't want to send another one
    if (!response.headersSent) {
      response.status(status).json({
        statusCode: status,
        message: message,
        details: details,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
