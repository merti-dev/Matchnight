import { Injectable, Logger } from '@nestjs/common';
import { currentSeason, seasonsBetween } from '@matchnight/core';
import { loadArchive } from '@matchnight/core/node';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AppConfig } from '../../config/app.config.js';
import type { MatchSource, SourceBatch } from './match-source.js';

const BASE = 'https://raw.githubusercontent.com/openfootball/champions-league/master';
const FIRST_SEASON = '2011-12';

/** openfootball/champions-league (CC0): 2011-12'den bu yana bütün sezonlar. */
@Injectable()
export class OpenfootballSource implements MatchSource {
  readonly name = 'openfootball';
  private readonly logger = new Logger(OpenfootballSource.name);

  constructor(private readonly config: AppConfig) {}

  isEnabled(): boolean {
    return true;
  }

  private get dir(): string {
    return join(this.config.dataDir, 'archive');
  }

  async load(): Promise<SourceBatch> {
    const warnings: string[] = [];
    if (!this.config.offline) {
      try {
        await this.download();
      } catch (err) {
        // Ağ yoksa diskteki son kopyayla devam: site çalışmaya devam etsin
        warnings.push(`arşiv indirilemedi, diskteki kopya kullanılıyor: ${(err as Error).message}`);
      }
    }
    const archive = loadArchive(this.dir);
    return { matches: archive.matches, seasons: archive.seasons, warnings: [...warnings, ...archive.warnings] };
  }

  private async download(): Promise<void> {
    mkdirSync(this.dir, { recursive: true });
    for (const season of seasonsBetween(FIRST_SEASON, currentSeason())) {
      const res = await fetch(`${BASE}/${season}/cl.txt`);
      if (res.status === 404) continue; // henüz yayımlanmamış sezon
      if (!res.ok) throw new Error(`${season}: HTTP ${res.status}`);
      writeFileSync(join(this.dir, `${season}.txt`), await res.text());
    }
    this.logger.log(`arşiv güncellendi: ${this.dir}`);
  }
}
