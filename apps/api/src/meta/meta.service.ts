import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/sqlite';
import { DEFAULT_PARAMS, currentSeason, type EloParams, type EvaluationDto, type MetaDto } from '@matchnight/core';
import { MatchRepository } from '../matches/match.repository.js';
import { MetaEntry } from './meta.entity.js';

@Injectable()
export class MetaService {
  constructor(
    private readonly em: EntityManager,
    private readonly matches: MatchRepository,
  ) {}

  async get(): Promise<MetaDto> {
    const entries = await this.em.find(MetaEntry, {});
    const value = <T>(key: string, fallback: T): T => (entries.find((e) => e.key === key)?.value as T) ?? fallback;
    const seasons = await this.matches.seasons();
    return {
      lastSync: value<string | null>('lastSync', null),
      liveSource: value<MetaDto['liveSource']>('liveSource', 'none'),
      currentSeason: currentSeason(),
      latestSeason: seasons.at(-1) ?? null,
      seasons,
      params: value<EloParams>('params', DEFAULT_PARAMS),
      evaluation: value<EvaluationDto | null>('evaluation', null),
    };
  }

  /** Sıralamaya girmek için oynanmış olması gereken en eski sezon (son iki sezon). */
  async activeSince(): Promise<string | null> {
    const seasons = await this.matches.seasons();
    return seasons.at(-2) ?? seasons.at(-1) ?? null;
  }
}
