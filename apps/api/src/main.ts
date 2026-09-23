import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MikroORM } from '@mikro-orm/sqlite';
import { AppModule } from './app.module.js';
import { configureApp } from './bootstrap.js';
import { AppConfig } from './config/app.config.js';

const app = configureApp(await NestFactory.create(AppModule));

// Küçük bir uygulama için şema değişiklikleri açılışta uygulanıyor.
// Symfony'deki karşılığı deploy adımındaki "doctrine:migrations:migrate".
await app.get(MikroORM).migrator.up();

await app.listen(app.get(AppConfig).port);
console.log(`api hazır: ${await app.getUrl()}/api`);
