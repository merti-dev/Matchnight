import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { inferGroups } from './groups.js';
import { parseOpenfootball } from './openfootball.js';
import type { RawMatch } from './types.js';

/** data/archive/<sezon>.txt dosyalarını (openfootball) okuyup ham maç listesi döner. */
export function loadArchive(dir: string): { matches: RawMatch[]; warnings: string[]; seasons: string[] } {
  if (!existsSync(dir)) return { matches: [], warnings: [`${dir} yok — önce npm run sync`], seasons: [] };
  const seasons = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}\.txt$/.test(f))
    .map((f) => f.replace('.txt', ''))
    .sort();
  const matches: RawMatch[] = [];
  const warnings: string[] = [];
  for (const season of seasons) {
    const result = parseOpenfootball(readFileSync(join(dir, `${season}.txt`), 'utf8'), season);
    inferGroups(result.matches);
    matches.push(...result.matches);
    warnings.push(...result.warnings.map((w) => `${season} ${w}`));
  }
  return { matches, warnings, seasons };
}
