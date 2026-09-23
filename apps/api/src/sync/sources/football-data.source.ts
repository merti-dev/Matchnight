import { Injectable } from '@nestjs/common';
import { currentSeason, fetchFootballDataSeason } from '@matchnight/core';
import { AppConfig } from '../../config/app.config.js';
import type { MatchSource, SourceBatch } from './match-source.js';

/** football-data.org — güncel sezonun fikstürü ve skorları. Anahtar yoksa devre dışı. */
@Injectable()
export class FootballDataSource implements MatchSource {
  readonly name = 'football-data';

  constructor(private readonly config: AppConfig) {}

  isEnabled(): boolean {
    return Boolean(this.config.footballDataToken);
  }

  async load(): Promise<SourceBatch> {
    const season = currentSeason();
    const result = await fetchFootballDataSeason(season, this.config.footballDataToken!);
    return {
      matches: result.matches,
      seasons: result.matches.length ? [season] : [],
      warnings: result.skipped.length ? [`football-data: ${result.skipped.length} maç atlandı (ön eleme/kura öncesi)`] : [],
    };
  }
}
