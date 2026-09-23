import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inferGroups } from '../src/groups.js';
import { normalize } from '../src/normalize.js';
import { parseOpenfootball } from '../src/openfootball.js';
import { computeStandings, leagueZone } from '../src/standings.js';

const DIR = join(import.meta.dirname, 'fixtures/openfootball');
const seasons = readdirSync(DIR).map((f) => f.replace('.txt', '')).sort();

function load(season: string) {
  const parsed = parseOpenfootball(readFileSync(join(DIR, `${season}.txt`), 'utf8'), season);
  inferGroups(parsed.matches);
  return normalize(parsed.matches).matches;
}

/*
 * Doğrulama gerçek sonuçla yapılıyor: hesapladığımız tabloda tur atlayan
 * takımlar, o sezon gerçekten bir sonraki turda oynayan takımlarla aynı olmalı.
 * Eşitlik kurallarında bir hata varsa burada yakalanır.
 */
describe.each(seasons)('puan durumu gerçek tur atlayanlarla tutuyor: %s', (season) => {
  const matches = load(season);
  const teamsIn = (stage: string) => new Set(matches.filter((m) => m.stage === stage).flatMap((m) => [m.homeId, m.awayId]));

  const groupMatches = matches.filter((m) => m.stage === 'GROUP');
  if (groupMatches.length) {
    it('her grubun ilk ikisi son 16 takımları', () => {
      const r16 = teamsIn('R16');
      const letters = [...new Set(groupMatches.map((m) => m.group!))].sort();
      const qualified: string[] = [];
      for (const letter of letters) {
        const table = computeStandings(groupMatches.filter((m) => m.group === letter), season, 'GROUP');
        expect(table).toHaveLength(4);
        qualified.push(table[0]!.teamId, table[1]!.teamId);
        expect(r16.has(table[2]!.teamId)).toBe(false);
      }
      expect(new Set(qualified)).toEqual(r16);
    });
  }

  const leagueMatches = matches.filter((m) => m.stage === 'LEAGUE');
  if (leagueMatches.length) {
    it('lig aşaması: 1-8 doğrudan son 16, 9-24 play-off', () => {
      const table = computeStandings(leagueMatches, season, 'LEAGUE');
      expect(table).toHaveLength(36);
      const playoff = teamsIn('PLAYOFF');
      const r16 = teamsIn('R16');
      const direct = new Set([...r16].filter((t) => !playoff.has(t)));
      expect(new Set(table.filter((r) => leagueZone(r.position) === 'r16').map((r) => r.teamId))).toEqual(direct);
      expect(new Set(table.filter((r) => leagueZone(r.position) === 'playoff').map((r) => r.teamId))).toEqual(playoff);
    });

    it('play-off eşleşmeleri 9-16 ile 17-24 arasında (tohum sınırı doğru)', () => {
      const table = computeStandings(leagueMatches, season, 'LEAGUE');
      const pos = new Map(table.map((r) => [r.teamId, r.position]));
      for (const m of matches.filter((x) => x.stage === 'PLAYOFF')) {
        const [a, b] = [pos.get(m.homeId)!, pos.get(m.awayId)!].sort((x, y) => x - y);
        expect(a).toBeLessThanOrEqual(16);
        expect(b).toBeGreaterThanOrEqual(17);
      }
    });
  }
});
