import { Global, Injectable, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join, resolve } from 'node:path';

/**
 * Tipli konfigürasyon (Symfony'deki parameters + %env()% karşılığı).
 * Ortam değişkenleri tek yerde okunur; servisler string anahtarlarla uğraşmaz.
 */
@Injectable()
export class AppConfig {
  constructor(private readonly env: ConfigService) {}

  /** data/ dizini: arşiv dosyaları ve SQLite. Varsayılan: repo kökündeki data/. */
  get dataDir(): string {
    return this.env.get<string>('MATCHNIGHT_DATA_DIR') ?? resolve(import.meta.dirname, '../../../../data');
  }

  get dbPath(): string {
    return this.env.get<string>('MATCHNIGHT_DB') ?? join(this.dataDir, 'matchnight.db');
  }

  get footballDataToken(): string | undefined {
    return this.env.get<string>('FOOTBALL_DATA_TOKEN') || undefined;
  }

  get syncIntervalMinutes(): number {
    return Math.max(5, Number(this.env.get('SYNC_INTERVAL_MINUTES')) || 30);
  }

  /** false ise açılışta senkron yapılmaz (testler için). */
  get syncOnBoot(): boolean {
    return this.env.get('SYNC_ON_BOOT') !== 'false';
  }

  /** true ise arşiv indirilmez, diskteki data/archive kullanılır. */
  get offline(): boolean {
    return this.env.get('SYNC_OFFLINE') === 'true';
  }

  get port(): number {
    return Number(this.env.get('PORT')) || 3001;
  }
}

@Global()
@Module({
  imports: [ConfigModule.forRoot({ envFilePath: [resolve(import.meta.dirname, '../../../../.env'), '.env'] })],
  providers: [AppConfig],
  exports: [AppConfig],
})
export class AppConfigModule {}
