import { ValidationPipe, type INestApplication } from '@nestjs/common';

/** Hem main.ts hem e2e testleri aynı ayarlarla çalışsın diye tek yerde. */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.enableShutdownHooks();
  return app;
}
