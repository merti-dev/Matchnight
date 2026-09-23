import type { Match, Score, Stage } from './types.js';

export type DecidedBy = 'aggregate' | 'away-goals' | 'extra-time' | 'penalties' | 'single-match';

export interface Tie {
  stage: Stage;
  /** İlk ayağın ev sahibi. */
  firstHomeId: string;
  firstAwayId: string;
  legs: Match[];
  /** firstHomeId açısından toplam skor. */
  aggregate: Score | null;
  winnerId: string | null;
  decidedBy: DecidedBy | null;
}

/** Deplasman golü kuralı UEFA'da 2021-22 sezonundan itibaren kaldırıldı. */
export function awayGoalsRule(season: string): boolean {
  return Number(season.slice(0, 4)) <= 2020;
}

/**
 * Bir eşleşmenin kazananını yalnızca skorlardan çıkarır:
 * tek maç → skor, eşitse penaltı; iki ayak → toplam skor, eşitse (2021 öncesi)
 * deplasman golü, o da eşitse ikinci maçın uzatması/penaltıları.
 */
export function resolveTie(legs: Match[]): Tie {
  const ordered = [...legs].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  const first = ordered[0]!;
  const a = first.homeId;
  const b = first.awayId;
  const base = { stage: first.stage, firstHomeId: a, firstAwayId: b, legs: ordered };

  if (ordered.some((m) => m.status !== 'finished' || !m.score)) {
    return { ...base, aggregate: null, winnerId: null, decidedBy: null };
  }

  let goalsA = 0;
  let goalsB = 0;
  let awayA = 0;
  let awayB = 0;
  for (const m of ordered) {
    const forA = m.homeId === a ? m.score!.home : m.score!.away;
    const forB = m.homeId === a ? m.score!.away : m.score!.home;
    goalsA += forA;
    goalsB += forB;
    if (m.homeId === b) awayA += forA;
    else awayB += forB;
  }
  const aggregate = { home: goalsA, away: goalsB };
  const last = ordered.at(-1)!;
  const lastWinner = (): string | null => {
    if (!last.penalties) return null;
    return last.penalties.home > last.penalties.away ? last.homeId : last.awayId;
  };

  if (ordered.length === 1) {
    if (goalsA !== goalsB) return { ...base, aggregate, winnerId: goalsA > goalsB ? a : b, decidedBy: last.extraTime ? 'extra-time' : 'single-match' };
    return { ...base, aggregate, winnerId: lastWinner(), decidedBy: 'penalties' };
  }

  if (goalsA !== goalsB) {
    return { ...base, aggregate, winnerId: goalsA > goalsB ? a : b, decidedBy: last.extraTime ? 'extra-time' : 'aggregate' };
  }
  // Uzatmada atılan deplasman golü de sayılır (2021 öncesi kural)
  if (awayGoalsRule(first.season) && awayA !== awayB) {
    return { ...base, aggregate, winnerId: awayA > awayB ? a : b, decidedBy: 'away-goals' };
  }
  return { ...base, aggregate, winnerId: lastWinner(), decidedBy: 'penalties' };
}

/** Bir sezonun eleme maçlarını eşleşmelere gruplar (aşama sırasıyla). */
export function groupTies(matches: Match[]): Tie[] {
  const byPair = new Map<string, Match[]>();
  for (const m of matches) {
    if (m.stage === 'GROUP' || m.stage === 'LEAGUE') continue;
    const key = `${m.stage}|${[m.homeId, m.awayId].sort().join('|')}`;
    byPair.set(key, [...(byPair.get(key) ?? []), m]);
  }
  return [...byPair.values()].map(resolveTie);
}
