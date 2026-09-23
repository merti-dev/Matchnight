import { describe, expect, it } from 'vitest';
import { DEFAULT_PARAMS, MEAN, expectedHome, goalMultiplier, probabilities, runElo } from '../src/elo.js';
import type { Match } from '../src/types.js';

let seq = 0;
function match(over: Partial<Match> & Pick<Match, 'homeId' | 'awayId'>): Match {
  seq++;
  return {
    id: `m${seq}`,
    season: '2025-26',
    stage: 'LEAGUE',
    group: null,
    round: 1,
    kickoff: `2025-10-${String(seq).padStart(2, '0')}T19:00:00.000Z`,
    timeKnown: true,
    status: 'finished',
    score: { home: 1, away: 0 },
    halfTime: null,
    extraTime: false,
    penalties: null,
    neutral: false,
    ...over,
  };
}

describe('Elo formülü', () => {
  it('eşit güçte beklenen skor 0.5', () => {
    expect(expectedHome(0)).toBeCloseTo(0.5);
  });
  it('400 puan fark ≈ %91 beklenen skor', () => {
    expect(expectedHome(400)).toBeCloseTo(10 / 11, 3);
  });
  it('gol çarpanı', () => {
    expect([0, 1, 2, 3, 5].map(goalMultiplier)).toEqual([1, 1, 1.5, 14 / 8, 16 / 8]);
  });
  it('olasılıklar 1 eder, beraberlik fark büyüdükçe azalır', () => {
    for (const d of [-600, -200, 0, 50, 300, 900]) {
      const p = probabilities(d);
      expect(p.home + p.draw + p.away).toBeCloseTo(1, 10);
      expect(Math.min(p.home, p.draw, p.away)).toBeGreaterThanOrEqual(0);
    }
    expect(probabilities(0).draw).toBeGreaterThan(probabilities(400).draw);
  });
  it('olasılıklar Elo beklenen skoruyla tutarlı: P(ev) + P(ber)/2 = E', () => {
    for (const d of [-300, 0, 120, 450]) {
      const p = probabilities(d);
      expect(p.home + p.draw / 2).toBeCloseTo(expectedHome(d), 6);
    }
  });
});

describe('Elo koşusu', () => {
  it('puan korunur: kazanan ne aldıysa kaybeden onu verir', () => {
    const { ratings } = runElo([match({ homeId: 'a', awayId: 'b', score: { home: 3, away: 0 } })]);
    expect(ratings.get('a')! + ratings.get('b')!).toBeCloseTo(2 * DEFAULT_PARAMS.newcomer, 9);
    expect(ratings.get('a')!).toBeGreaterThan(DEFAULT_PARAMS.newcomer);
  });

  it('tarafsız sahada ev avantajı yok: eşit güçte beraberlik puanı değiştirmez', () => {
    const { ratings } = runElo([match({ homeId: 'a', awayId: 'b', neutral: true, score: { home: 1, away: 1 } })]);
    expect(ratings.get('a')).toBeCloseTo(DEFAULT_PARAMS.newcomer, 9);
  });

  it('ev sahibi için beraberlik puan kaybettirir (beklenen skor 0.5 üstünde)', () => {
    const { ratings } = runElo([match({ homeId: 'a', awayId: 'b', score: { home: 1, away: 1 } })]);
    expect(ratings.get('a')!).toBeLessThan(DEFAULT_PARAMS.newcomer);
  });

  it('penaltıyla biten maç Elo için beraberlik', () => {
    const withPens = runElo([match({ homeId: 'a', awayId: 'b', neutral: true, score: { home: 1, away: 1 }, penalties: { home: 5, away: 4 } })]);
    expect(withPens.ratings.get('a')).toBeCloseTo(DEFAULT_PARAMS.newcomer, 9);
  });

  it('oynanmamış maç puanı değiştirmez ama tahmin üretir', () => {
    const { ratings, perMatch } = runElo([
      match({ id: 'x', homeId: 'a', awayId: 'b', status: 'scheduled', score: null }),
    ]);
    expect(ratings.size).toBe(0);
    expect(perMatch.get('x')!.homeAfter).toBeNull();
    expect(perMatch.get('x')!.prob.home).toBeGreaterThan(perMatch.get('x')!.prob.away);
  });

  it('yeni sezonda puanlar ortalamaya doğru çekilir', () => {
    const params = { ...DEFAULT_PARAMS, seasonRegression: 0.5 };
    const { perMatch } = runElo(
      [
        match({ homeId: 'a', awayId: 'b', score: { home: 5, away: 0 } }),
        match({ id: 'next', season: '2026-27', kickoff: '2026-09-20T19:00:00.000Z', homeId: 'a', awayId: 'c', status: 'scheduled', score: null }),
      ],
      params,
    );
    const first = runElo([match({ homeId: 'a', awayId: 'b', score: { home: 5, away: 0 } })], params).ratings.get('a')!;
    expect(perMatch.get('next')!.homeBefore).toBeCloseTo(MEAN + (first - MEAN) * 0.5, 9);
  });
});
