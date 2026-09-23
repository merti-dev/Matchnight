import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { SqliteDriver } from '@mikro-orm/sqlite';
import { AppConfig } from '../config/app.config.js';
import { ENTITIES, ormOptions } from './orm.config.js';

@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      // Sürücüye özel EntityManager'ın (@mikro-orm/sqlite) enjekte edilebilmesi için
      // async konfigürasyonda sürücü modül seviyesinde de belirtilmeli.
      driver: SqliteDriver,
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ormOptions(config.dbPath),
    }),
    MikroOrmModule.forFeature(ENTITIES),
  ],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}
