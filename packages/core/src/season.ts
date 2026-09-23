/** Temmuzdan itibaren yeni sezon sayılır: 2026-09 -> "2026-27". */
export function currentSeason(now = new Date()): string {
  const y = now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, '0')}`;
}

export function seasonLabel(season: string): string {
  return season.replace('-', '/');
}

export function seasonsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    out.push(`${y}-${String((y + 1) % 100).padStart(2, '0')}`);
  }
  return out;
}
