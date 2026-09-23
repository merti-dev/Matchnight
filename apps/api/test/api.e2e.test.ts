import 'reflect-metadata';
import { MikroORM } from '@mikro-orm/sqlite';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { KnockoutsDto, MatchDetailDto, MetaDto, RankingRowDto, StandingsDto, TeamDetailDto } from '@matchnight/core';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

/*
 * Uygulamanın tamamı: gerçek modüller, gerçek SQLite (bellekte), gerçek senkron —
 * yalnızca veri ağdan değil repodaki test arşivinden okunuyor.
 */
let app: INestApplication;
let base: string;
let dataDir: string;

beforeAll(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'matchnight-'));
  cpSync(resolve(import.meta.dirname, '../../../packages/core/tests/fixtures/openfootball'), join(dataDir, 'archive'), { recursive: true });
  Object.assign(process.env, {
    MATCHNIGHT_DATA_DIR: dataDir,
    MATCHNIGHT_DB: ':memory:',
    SYNC_OFFLINE: 'true',
    SYNC_ON_BOOT: 'false',
    FOOTBALL_DATA_TOKEN: '',
  });

  const { AppModule } = await import('../src/app.module.js');
  const { configureApp } = await import('../src/bootstrap.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = configureApp(moduleRef.createNestApplication());
  await app.get(MikroORM).migrator.up();
  await app.listen(0);
  base = `${(await app.getUrl()).replace('[::1]', '127.0.0.1')}/api`;
});

afterAll(async () => {
  await app?.close();
  rmSync(dataDir, { recursive: true, force: true });
});

const get = async <T>(path: string): Promise<{ status: number; body: T }> => {
  const res = await fetch(`${base}${path}`);
  return { status: res.status, body: (await res.json()) as T };
};

describe('şema', () => {
  it('migration sonrası entity ile veritabanı arasında fark yok (doctrine:schema:validate)', async () => {
    const diff = await app.get(MikroORM).schema.getUpdateSchemaSQL();
    expect(diff.trim(), `migration eksik — node dist/cli.js migration:create ile üret:\n${diff}`).toBe('');
  });
});

describe('API', () => {
  // Senkron şema testinden sonra: eksik migration önce şema testinde net mesajla yakalansın
  beforeAll(async () => {
    const { SyncService } = await import('../src/sync/sync.service.js');
    await app.get(SyncService).run();
  });

  it('meta: 15 sezon, değerlendirme basit yöntemlerden iyi', async () => {
    const { body } = await get<MetaDto>('/meta');
    expect(body.seasons).toHaveLength(15);
    expect(body.latestSeason).toBe('2025-26');
    expect(body.evaluation!.elo.logLoss).toBeLessThan(body.evaluation!.baseRates.logLoss);
    expect(body.evaluation!.baseRates.logLoss).toBeLessThan(body.evaluation!.uniform.logLoss);
  });

  it('lig aşaması tablosu: 36 takım, 8/16/12 bölge', async () => {
    const { body } = await get<StandingsDto>('/seasons/2025-26/standings');
    const zones = body.tables[0]!.rows.map((r) => r.zone);
    expect(zones.filter((z) => z === 'r16')).toHaveLength(8);
    expect(zones.filter((z) => z === 'playoff')).toHaveLength(16);
    expect(zones.filter((z) => z === 'out')).toHaveLength(12);
  });

  it('eleme turları: final penaltılarla PSG', async () => {
    const { body } = await get<KnockoutsDto>('/seasons/2025-26/knockouts');
    const final = body.rounds.find((r) => r.stage === 'FINAL')!.ties[0]!;
    expect(final.winnerId).toBe('psg');
    expect(final.decidedBy).toBe('penalties');
  });

  it('maç detayı: olasılıklar 1 eder, ikili geçmiş bu maçı içermez', async () => {
    const final = (await get<KnockoutsDto>('/seasons/2025-26/knockouts')).body.rounds.at(-1)!.ties[0]!.legs[0]!;
    const { body } = await get<MatchDetailDto>(`/matches/${final.id}`);
    const p = body.match.prob!;
    expect(p.home + p.draw + p.away).toBeCloseTo(1, 9);
    expect(body.h2h.map((m) => m.id)).not.toContain(final.id);
  });

  it('kulüp: yolculuk ve Elo geçmişi', async () => {
    const { body } = await get<TeamDetailDto>('/teams/psg');
    expect(body.journey.find((j) => j.season === '2025-26')!.reached).toBe('WINNER');
    expect(body.history.length).toBeGreaterThan(50);
  });

  it('sıralama sadece son iki sezonda oynamış kulüpler', async () => {
    const { body } = await get<RankingRowDto[]>('/teams/ranking');
    expect(body.every((r) => ['2024-25', '2025-26'].includes(r.lastSeason))).toBe(true);
    expect(body[0]!.rank).toBe(1);
  });

  it.each([
    ['/seasons/2025-27/standings', 400],
    ['/seasons/1999-00/standings', 404],
    ['/matches/upcoming?limit=500', 400],
    ['/matches/on-this-day?date=13-45', 400],
    ['/teams/yok', 404],
  ])('%s -> %i', async (path, status) => {
    expect((await get(path)).status).toBe(status);
  });
});
