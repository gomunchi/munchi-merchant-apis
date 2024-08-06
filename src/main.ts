import { ValidationPipe } from '@nestjs/common';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder } from '@nestjs/swagger';
import { SwaggerDocumentOptions, SwaggerModule } from '@nestjs/swagger/dist';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './filters/sentry.filter';

import { AppModule } from './app/app.module';
import { Logger, LoggerErrorInterceptor } from 'nestjs-pino';
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
    bufferLogs: true,
  });

  const config = new DocumentBuilder()
    .setTitle('Api documentation')
    .setDescription('The API description of munchi-apis')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const options: SwaggerDocumentOptions = {
    deepScanRoutes: true,
    operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
  };

  const document = SwaggerModule.createDocument(app, config, options);
  SwaggerModule.setup('api', app, document);

  //init Sentry

  if (process.env.NODE_ENV === 'production') {
    // Initialize Sentry with your DSN
    Sentry.init({
      dsn: process.env.SENTRY_DNS,
    });
  }

  const { httpAdapter } = app.get(HttpAdapterHost);

  app.useGlobalFilters(new SentryFilter(httpAdapter));

  app.enableCors({
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  app.useLogger(app.get(Logger));
  app.useGlobalInterceptors(new LoggerErrorInterceptor());

  await app.listen(process.env.PORT);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
