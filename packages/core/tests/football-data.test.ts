import { describe, expect, it } from 'vitest';
import { matchScore, normalizeFootballData, type FdMatch } from '../src/football-data.js';

/*
 * Bu yanıtlar football-data.org v4 dokümantasyonundaki yapıya göre elle kuruldu,
 * gerçek bir API çağrısından alınmadı. Gerçek anahtarla ilk senkronda yapı
 * farklı çıkarsa bu testler güncellenmeli.
 */
const base = (over: Partial<FdMatch>): FdMatch => ({
  id: 1,
  utcDate: '2026-09-16T16:45:00Z',
  status: 'FINISHED',
  matchday: 1,
  stage: 'LEAGUE_STAGE',
  group: null,
  homeTeam: { id: 5, name: 'FC Bayern München' },
  awayTeam: { id: 57, name: 'Arsenal FC' },
  score: { duration: 'REGULAR', fullTime: { home: 2, away: 1 }, halfTime: { home: 1, away: 0 } },
  ...over,
});

describe('football-data skor', () => {
  it('normal süre', () => {
    expect(matchScore(base({}).score)).toEqual({ home: 2, away: 1 });
  });
  it('penaltı golleri fullTime içinde olsa bile maç skoru normal süre + uzatma', () => {
    expect(
      matchScore({
        duration: 'PENALTY_SHOOTOUT',
        fullTime: { home: 5, away: 4 },
        halfTime: { home: 0, away: 1 },
        regularTime: { home: 1, away: 1 },
        extraTime: { home: 0, away: 0 },
        penalties: { home: 4, away: 3 },
      }),
    ).toEqual({ home: 1, away: 1 });
  });
  it('regularTime yoksa fullTime - penaltılar', () => {
    expect(
      matchScore({
        duration: 'PENALTY_SHOOTOUT',
        fullTime: { home: 5, away: 4 },
        halfTime: { home: 0, away: 1 },
        penalties: { home: 4, away: 3 },
      }),
    ).toEqual({ home: 1, away: 1 });
  });
  it('uzatmada biten maç: normal süre + uzatma golleri', () => {
    expect(
      matchScore({
        duration: 'EXTRA_TIME',
        fullTime: { home: 3, away: 1 },
        halfTime: { home: 1, away: 0 },
        regularTime: { home: 1, away: 1 },
        extraTime: { home: 2, away: 0 },
      }),
    ).toEqual({ home: 3, away: 1 });
  });
  it('oynanmamış maç skorsuz', () => {
    expect(matchScore({ fullTime: { home: null, away: null }, halfTime: { home: null, away: null } })).toBeNull();
  });
});

describe('football-data normalizasyon', () => {
  const teams = [
    { id: 5, name: 'FC Bayern München', area: { code: 'DEU' } },
    { id: 57, name: 'Arsenal FC', area: { code: 'ENG' } },
  ];

  it('lig aşaması maçı, ülke kodu UEFA biçimine çevriliyor', () => {
    const { matches } = normalizeFootballData('2026-27', [base({})], teams);
    expect(matches[0]).toMatchObject({
      stage: 'LEAGUE', round: 1, status: 'finished', score: { home: 2, away: 1 },
      home: { name: 'FC Bayern München', country: 'GER' }, away: { country: 'ENG' },
    });
  });

  it('planlanmış maçın skoru yok', () => {
    const { matches } = normalizeFootballData(
      '2026-27',
      [base({ status: 'TIMED', score: { fullTime: { home: null, away: null }, halfTime: { home: null, away: null } } })],
      teams,
    );
    expect(matches[0]).toMatchObject({ status: 'scheduled', score: null });
  });

  it('ön eleme ve takımı belli olmayan maçlar atlanıyor', () => {
    const { matches, skipped } = normalizeFootballData(
      '2026-27',
      [
        base({ id: 2, stage: 'QUALIFICATION_ROUND_3' }),
        base({ id: 3, stage: 'LAST_16', homeTeam: { id: null, name: null } }),
      ],
      teams,
    );
    expect(matches).toHaveLength(0);
    expect(skipped).toHaveLength(2);
  });

  it('eleme turu: iki ayak numaralanıyor, final tarafsız', () => {
    const { matches } = normalizeFootballData(
      '2026-27',
      [
        base({ id: 10, stage: 'LAST_16', utcDate: '2027-03-03T20:00:00Z' }),
        base({ id: 11, stage: 'LAST_16', utcDate: '2027-03-10T20:00:00Z', homeTeam: { id: 57, name: 'Arsenal FC' }, awayTeam: { id: 5, name: 'FC Bayern München' } }),
        base({ id: 12, stage: 'FINAL', utcDate: '2027-05-29T19:00:00Z' }),
      ],
      teams,
    );
    expect(matches.map((m) => [m.stage, m.round, m.neutral])).toEqual([
      ['R16', 1, false],
      ['R16', 2, false],
      ['FINAL', null, true],
    ]);
  });
});
