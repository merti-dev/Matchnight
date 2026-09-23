import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AppConfig } from '../config/app.config.js';
import { SyncService } from './sync.service.js';

/**
 * Symfony Scheduler karşılığı. Aralık konfigürasyondan geldiği için @Interval
 * decorator'ı yerine SchedulerRegistry ile çalışma anında kaydediliyor.
 */
@Injectable()
export class SyncScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(
    private readonly sync: SyncService,
    private readonly config: AppConfig,
    private readonly registry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    const tick = () => this.sync.run().catch((err) => this.logger.error(`senkron başarısız: ${(err as Error).message}`));
    if (this.config.syncOnBoot) void tick();
    const minutes = this.config.syncIntervalMinutes;
    this.registry.addInterval('sync', setInterval(tick, minutes * 60_000));
    this.logger.log(`senkron her ${minutes} dakikada bir`);
  }
}
