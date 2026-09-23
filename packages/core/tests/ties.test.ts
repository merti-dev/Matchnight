import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inferGroups } from '../src/groups.js';
import { normalize } from '../src/normalize.js';
import { parseOpenfootball } from '../src/openfootball.js';
import { groupTies } from '../src/ties.js';
import { STAGES } from '../src/types.js';

const DIR = join(import.meta.dirname, 'fixtures/openfootball');
const seasons = readdirSync(DIR).map((f) => f.replace('.txt', '')).sort();

/*
 * Kazananı yalnızca skorlardan (toplam, deplasman golü, penaltı) hesaplıyoruz ve
 * bir sonraki turda gerçekten oynayan takımla karşılaştırıyoruz.
 */
describe.each(seasons)('eşleşme kazananları gerçekle tutuyor: %s', (season) => {
  const parsed = parseOpenfootball(readFileSync(join(DIR, `${season}.txt`), 'utf8'), season);
  inferGroups(parsed.matches);
  const { matches } = normalize(parsed.matches);
  const ties = groupTies(matches);

  it('her eşleşmenin kazananı bir sonraki turda', () => {
    for (const tie of ties) {
      expect(tie.winnerId, `${tie.stage} ${tie.firstHomeId}-${tie.firstAwayId}`).not.toBeNull();
      if (tie.stage === 'FINAL') continue;
      const next = STAGES[STAGES.indexOf(tie.stage) + 1]!;
      const nextTeams = new Set(matches.filter((m) => m.stage === next).flatMap((m) => [m.homeId, m.awayId]));
      const loser = tie.winnerId === tie.firstHomeId ? tie.firstAwayId : tie.firstHomeId;
      expect(nextTeams.has(tie.winnerId!), `${season} ${tie.stage}: ${tie.winnerId} sonraki turda yok`).toBe(true);
      expect(nextTeams.has(loser)).toBe(false);
    }
  });
});

describe('deplasman golü kuralı gerçekten devrede', () => {
  it('en az bir eşleşme deplasman golüyle belirlenmiş (2011-2021)', () => {
    const decided = seasons
      .filter((s) => Number(s.slice(0, 4)) <= 2020)
      .flatMap((s) => {
        const p = parseOpenfootball(readFileSync(join(DIR, `${s}.txt`), 'utf8'), s);
        return groupTies(normalize(p.matches).matches);
      })
      .filter((t) => t.decidedBy === 'away-goals');
    expect(decided.length).toBeGreaterThan(0);
  });
});
