import type { Match } from './types.js';

export interface StandingRow {
  teamId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDiff: number;
  points: number;
  awayGoals: number;
  awayWins: number;
  /** Son maçlar, eskiden yeniye: W/D/L. */
  form: Array<'W' | 'D' | 'L'>;
  position: number;
}

type Rule = 'group-away-goals' | 'group' | 'league';

/** Sezona göre UEFA eşitlik kuralları. */
export function rulesFor(season: string, mode: 'GROUP' | 'LEAGUE'): Rule {
  if (mode === 'LEAGUE') return 'league';
  return Number(season.slice(0, 4)) <= 2020 ? 'group-away-goals' : 'group';
}

function emptyRow(teamId: string): StandingRow {
  return { teamId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0, awayGoals: 0, awayWins: 0, form: [], position: 0 };
}

function tabulate(matches: Match[], teams: Iterable<string>): Map<string, StandingRow> {
  const rows = new Map<string, StandingRow>();
  for (const t of teams) rows.set(t, emptyRow(t));
  const ordered = [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff));
  for (const m of ordered) {
    if (m.status !== 'finished' || !m.score) continue;
    const home = rows.get(m.homeId);
    const away = rows.get(m.awayId);
    if (!home || !away) continue;
    const { home: hg, away: ag } = m.score;
    home.played++; away.played++;
    home.goalsFor += hg; home.goalsAgainst += ag;
    away.goalsFor += ag; away.goalsAgainst += hg;
    away.awayGoals += ag;
    if (hg > ag) {
      home.won++; home.points += 3; away.lost++;
      home.form.push('W'); away.form.push('L');
    } else if (hg < ag) {
      away.won++; away.points += 3; home.lost++; away.awayWins++;
      home.form.push('L'); away.form.push('W');
    } else {
      home.drawn++; away.drawn++; home.points++; away.points++;
      home.form.push('D'); away.form.push('D');
    }
  }
  for (const r of rows.values()) r.goalDiff = r.goalsFor - r.goalsAgainst;
  return rows;
}

type Key = (r: StandingRow) => number[];

/** Anahtara göre sıralar ve eşit kalan blokları döner. */
function sortAndBlock(rows: StandingRow[], key: Key): StandingRow[][] {
  const cmp = (a: StandingRow, b: StandingRow) => {
    const ka = key(a);
    const kb = key(b);
    for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i]! - ka[i]!;
    return 0;
  };
  const sorted = [...rows].sort(cmp);
  const blocks: StandingRow[][] = [];
  for (const r of sorted) {
    const last = blocks.at(-1);
    if (last && cmp(last[0]!, r) === 0) last.push(r);
    else blocks.push([r]);
  }
  return blocks;
}

const overallKey: Key = (r) => [r.goalDiff, r.goalsFor, r.awayGoals, r.won, r.awayWins];

/**
 * Grup aşaması: puan eşitliğinde önce kendi aralarındaki maçlar (ikili averaj).
 * İkili averaj bloğu küçültürse kalan eşitler için aynı kurallar yeniden uygulanır,
 * küçültemezse genel averaja geçilir.
 */
function resolveGroupBlock(block: StandingRow[], matches: Match[], rule: Rule): StandingRow[] {
  if (block.length === 1) return block;
  const ids = new Set(block.map((r) => r.teamId));
  const mini = tabulate(matches.filter((m) => ids.has(m.homeId) && ids.has(m.awayId)), ids);
  const h2hKey: Key = (r) => {
    const h = mini.get(r.teamId)!;
    return rule === 'group-away-goals' ? [h.points, h.goalDiff, h.goalsFor, h.awayGoals] : [h.points, h.goalDiff, h.goalsFor];
  };
  const subBlocks = sortAndBlock(block, h2hKey);
  if (subBlocks.length === 1) {
    return sortAndBlock(block, overallKey).flat();
  }
  return subBlocks.flatMap((sub) => (sub.length < block.length ? resolveGroupBlock(sub, matches, rule) : sub));
}

/**
 * Lig aşaması (2024-25'ten beri): puan, averaj, atılan gol, deplasman golü,
 * galibiyet, deplasman galibiyeti, sonra rakiplerin topladığı puan/averaj/gol.
 */
function resolveLeague(rows: Map<string, StandingRow>, matches: Match[]): StandingRow[] {
  const opponents = new Map<string, string[]>();
  for (const m of matches) {
    opponents.set(m.homeId, [...(opponents.get(m.homeId) ?? []), m.awayId]);
    opponents.set(m.awayId, [...(opponents.get(m.awayId) ?? []), m.homeId]);
  }
  const opp = (id: string, f: (r: StandingRow) => number) =>
    (opponents.get(id) ?? []).reduce((sum, o) => sum + f(rows.get(o) ?? emptyRow(o)), 0);
  const key: Key = (r) => [
    r.points, r.goalDiff, r.goalsFor, r.awayGoals, r.won, r.awayWins,
    opp(r.teamId, (o) => o.points), opp(r.teamId, (o) => o.goalDiff), opp(r.teamId, (o) => o.goalsFor),
  ];
  return sortAndBlock([...rows.values()], key).flat();
}

/** Bir grubun ya da lig aşamasının puan durumu. */
export function computeStandings(matches: Match[], season: string, mode: 'GROUP' | 'LEAGUE'): StandingRow[] {
  const rule = rulesFor(season, mode);
  const teams = new Set(matches.flatMap((m) => [m.homeId, m.awayId]));
  const rows = tabulate(matches, teams);

  const ordered =
    rule === 'league'
      ? resolveLeague(rows, matches)
      : sortAndBlock([...rows.values()], (r) => [r.points]).flatMap((block) => resolveGroupBlock(block, matches, rule));

  ordered.forEach((r, i) => (r.position = i + 1));
  return ordered;
}

/** Lig aşaması sonrası bölgeler: 1-8 son 16, 9-24 play-off, 25-36 elendi. */
export function leagueZone(position: number): 'r16' | 'playoff' | 'out' {
  if (position <= 8) return 'r16';
  if (position <= 24) return 'playoff';
  return 'out';
}
