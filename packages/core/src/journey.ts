import { STAGES, type Match, type Stage } from './types.js';

export type Reached = Stage | 'WINNER';

/** Finalin kazananı: maç skoru, eşitse penaltılar. */
export function finalWinner(final: Match): string | null {
  if (final.status !== 'finished' || !final.score) return null;
  if (final.score.home !== final.score.away) return final.score.home > final.score.away ? final.homeId : final.awayId;
  if (final.penalties) return final.penalties.home > final.penalties.away ? final.homeId : final.awayId;
  return null;
}

/** Bir sezonun maçlarından her kulübün ulaştığı en ileri turu çıkarır. */
export function stagesReached(seasonMatches: Match[]): Map<string, Reached> {
  const order = (s: Stage) => STAGES.indexOf(s);
  const reached = new Map<string, Reached>();
  for (const m of seasonMatches) {
    for (const team of [m.homeId, m.awayId]) {
      const current = reached.get(team);
      if (current === 'WINNER') continue;
      if (!current || order(m.stage) > order(current)) reached.set(team, m.stage);
    }
  }
  const final = seasonMatches.find((m) => m.stage === 'FINAL');
  const winner = final ? finalWinner(final) : null;
  if (winner) reached.set(winner, 'WINNER');
  return reached;
}
