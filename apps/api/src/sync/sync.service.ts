import { Inject, Injectable, Logger } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/sqlite';
import {
  DEFAULT_PARAMS,
  berlinDate,
  currentSeason,
  evaluate,
  finalWinner,
  normalize,
  outcomeOf,
  runElo,
  type EvaluationDto,
  type Match as CoreMatch,
  type MatchRating,
  type Outcome,
  type Probabilities,
  type RawMatch,
} from '@matchnight/core';
import { MetaEntry } from '../meta/meta.entity.js';
import { Match } from '../matches/match.entity.js';
import { RatingPoint } from '../ratings/rating-point.entity.js';
import { Team } from '../teams/team.entity.js';
import { ARCHIVE_SOURCE, LIVE_SOURCE, type MatchSource } from './sources/match-source.js';

export interface SyncReport {
  seasons: string[];
  liveSource: 'football-data' | 'openfootball' | 'none';
  matches: number;
  teams: number;
  /** Güncel sezonda arşivde hiç görülmemiş kulüpler — yeni kulüp ya da eksik alias. */
  newTeams: string[];
  warnings: string[];
  durationMs: number;
}

const CHUNK = 100;
const chunks = <T>(list: T[]) => Array.from({ length: Math.ceil(list.length / CHUNK) }, (_, i) => list.slice(i * CHUNK, (i + 1) * CHUNK));

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private running: Promise<SyncReport> | null = null;

  constructor(
    private readonly em: EntityManager,
    @Inject(ARCHIVE_SOURCE) private readonly archive: MatchSource,
    @Inject(LIVE_SOURCE) private readonly live: MatchSource,
  ) {}

  /** Aynı anda iki senkron çalışmasın: devam eden varsa onun sonucunu bekle. */
  run(): Promise<SyncReport> {
    this.running ??= this.execute().finally(() => (this.running = null));
    return this.running;
  }

  private async execute(): Promise<SyncReport> {
    const started = Date.now();
    const season = currentSeason();

    const base = await this.archive.load();
    const warnings = [...base.warnings];
    let raw: RawMatch[] = base.matches;
    let liveSource: SyncReport['liveSource'] = base.seasons.includes(season) ? 'openfootball' : 'none';

    if (this.live.isEnabled()) {
      try {
        const live = await this.live.load();
        warnings.push(...live.warnings);
        if (live.matches.length) {
          raw = [...raw.filter((m) => m.season !== season), ...live.matches];
          liveSource = 'football-data';
        }
      } catch (err) {
        warnings.push(`${this.live.name}: ${(err as Error).message}`);
      }
    }

    const { matches, teams } = normalize(raw);
    const elo = runElo(matches, DEFAULT_PARAMS);
    const evaluation = this.evaluateRecent(matches, elo.perMatch, season);

    const archiveIds = new Set(matches.filter((m) => m.season !== season).flatMap((m) => [m.homeId, m.awayId]));
    const newTeams = [...new Set(matches.filter((m) => m.season === season).flatMap((m) => [m.homeId, m.awayId]))]
      .filter((id) => !archiveIds.has(id))
      .map((id) => teams.get(id)?.name ?? id);

    const lastSeason = new Map<string, string>();
    for (const m of [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff))) {
      if (m.status !== 'finished') continue;
      lastSeason.set(m.homeId, m.season);
      lastSeason.set(m.awayId, m.season);
    }

    // Tek transaction: ya hepsi yazılır ya hiçbiri (Doctrine'deki wrapInTransaction)
    await this.em.fork().transactional(async (em) => {
      await em.upsertMany(
        Team,
        [...teams.values()].map((t) => ({
          id: t.id,
          name: t.name,
          country: t.country,
          elo: elo.ratings.get(t.id) ?? null,
          lastSeason: lastSeason.get(t.id) ?? null,
        })),
      );

      await em.nativeDelete(RatingPoint, {});
      await em.nativeDelete(Match, { id: { $nin: matches.map((m) => m.id) } });

      for (const batch of chunks(matches)) {
        await em.upsertMany(Match, batch.map((m) => this.toRow(m, elo.perMatch.get(m.id), liveSource === 'football-data' && m.season === season)));
      }

      const points = [...elo.history.entries()].flatMap(([team, list]) =>
        list.map((p) => ({ team, match: p.matchId, kickoff: new Date(p.kickoff), rating: p.rating })),
      );
      for (const batch of chunks(points)) await em.insertMany(RatingPoint, batch);

      const meta: Record<string, unknown> = {
        lastSync: new Date().toISOString(),
        liveSource,
        currentSeason: season,
        evaluation,
        params: DEFAULT_PARAMS,
      };
      await em.upsertMany(MetaEntry, Object.entries(meta).map(([key, value]) => ({ key, value })));
    });

    const report: SyncReport = {
      seasons: [...new Set(matches.map((m) => m.season))].sort(),
      liveSource,
      matches: matches.length,
      teams: teams.size,
      newTeams,
      warnings,
      durationMs: Date.now() - started,
    };
    this.logger.log(`${report.matches} maç, ${report.teams} kulüp, güncel sezon: ${liveSource} (${report.durationMs} ms)`);
    for (const w of warnings) this.logger.warn(w);
    if (newTeams.length) this.logger.warn(`arşivde olmayan kulüpler: ${newTeams.join(', ')}`);
    return report;
  }

  private toRow(m: CoreMatch, r: MatchRating | undefined, fromLive: boolean) {
    return {
      id: m.id,
      season: m.season,
      stage: m.stage,
      grp: m.group,
      round: m.round,
      kickoff: new Date(m.kickoff),
      day: berlinDate(m.kickoff),
      timeKnown: m.timeKnown,
      home: m.homeId,
      away: m.awayId,
      status: m.status,
      score: m.score,
      halfTime: m.halfTime,
      extraTime: m.extraTime,
      penalties: m.penalties,
      neutral: m.neutral,
      source: fromLive ? 'football-data' : 'openfootball',
      elo: r
        ? {
            homeBefore: r.homeBefore,
            awayBefore: r.awayBefore,
            homeAfter: r.homeAfter,
            awayAfter: r.awayAfter,
            pHome: r.prob.home,
            pDraw: r.prob.draw,
            pAway: r.prob.away,
          }
        : null,
    };
  }

  /**
   * Son üç tamamlanmış sezonda modelin başarısı, iki basit yöntemle kıyaslı.
   * Parametreler 2013-14 … 2022-23'te seçildiği için bu sezonlar model için "görülmemiş".
   */
  private evaluateRecent(
    matches: CoreMatch[],
    perMatch: Map<string, { prob: Probabilities }>,
    season: string,
  ): EvaluationDto | null {
    const complete = [...new Set(matches.filter((m) => m.stage === 'FINAL' && finalWinner(m)).map((m) => m.season))]
      .filter((s) => s !== season)
      .sort();
    const test = complete.slice(-3);
    if (!test.length) return null;

    const finished = matches.filter((m) => m.status === 'finished' && m.score);
    const inTest = finished.filter((m) => test.includes(m.season));
    const before = finished.filter((m) => m.season < test[0]!);
    const freq = (o: Outcome) => before.filter((m) => outcomeOf(m) === o).length / Math.max(before.length, 1);
    const baseRates = { home: freq('home'), draw: freq('draw'), away: freq('away') };
    const pairs = (prob: (m: CoreMatch) => Probabilities) => inTest.map((m) => ({ prob: prob(m), outcome: outcomeOf(m)! }));

    return {
      seasons: test,
      elo: evaluate(pairs((m) => perMatch.get(m.id)!.prob)),
      baseRates: evaluate(pairs(() => baseRates)),
      uniform: evaluate(pairs(() => ({ home: 1 / 3, draw: 1 / 3, away: 1 / 3 }))),
    };
  }
}
