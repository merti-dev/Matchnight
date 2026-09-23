import type { RawMatch } from './types.js';

/**
 * Eleme turlarında ayak numarasını ve tarafsız sahayı çıkarır: aynı eşleşme
 * iki kez oynandıysa 1. ve 2. ayak, bir kez oynandıysa (finaller, 2019-20'nin
 * Lizbon turnuvası) tek maç ve tarafsız saha.
 */
export function annotateKnockouts(matches: RawMatch[]): RawMatch[] {
  const pairKey = (m: RawMatch) => `${m.stage}|${[m.home.name, m.away.name].sort().join('|')}`;
  const ties = new Map<string, RawMatch[]>();
  for (const m of matches) {
    if (m.stage === 'GROUP' || m.stage === 'LEAGUE') continue;
    const key = pairKey(m);
    ties.set(key, [...(ties.get(key) ?? []), m]);
  }
  for (const legs of ties.values()) {
    legs.sort((a, b) => a.kickoff.localeCompare(b.kickoff));
    if (legs.length === 1) {
      legs[0]!.neutral = true;
      legs[0]!.round = null;
    } else {
      legs.forEach((leg, i) => (leg.round = i + 1));
    }
  }
  return matches;
}
