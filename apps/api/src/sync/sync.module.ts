import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { FootballDataSource } from './sources/football-data.source.js';
import { ARCHIVE_SOURCE, LIVE_SOURCE } from './sources/match-source.js';
import { OpenfootballSource } from './sources/openfootball.source.js';
import { SyncService } from './sync.service.js';

@Module({
  imports: [DatabaseModule],
  providers: [
    // Arayüz -> somut sınıf eşlemesi (services.yaml'daki alias'ların karşılığı)
    { provide: ARCHIVE_SOURCE, useClass: OpenfootballSource },
    { provide: LIVE_SOURCE, useClass: FootballDataSource },
    SyncService,
  ],
  exports: [SyncService],
})
export class SyncModule {}
