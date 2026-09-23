import { annotateKnockouts } from './knockouts.js';
import type { MatchStatus, RawMatch, Score, Stage } from './types.js';

/**
 * football-data.org v4 adaptörü — güncel sezonun fikstürü ve canlıya yakın skorları.
 *   GET /v4/competitions/CL/matches?season=2026   (2026 = 2026-27 sezonu)
 *   GET /v4/competitions/CL/teams?season=2026     (takımların ülkesi için)
 * Ücretsiz katman dakikada 10 istek; bir senkron 2 istek harcar.
 */

const BASE = 'https://api.football-data.org/v4';

interface FdScore {
  home: number | null;
  away: number | null;
}

export interface FdMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  stage: string;
  group: string | null;
  homeTeam: { id: number | null; name: string | null };
  awayTeam: { id: number | null; name: string | null };
  score: {
    duration?: string;
    fullTime: FdScore;
    halfTime: FdScore;
    regularTime?: FdScore;
    extraTime?: FdScore;
    penalties?: FdScore;
  };
}

export interface FdTeam {
  id: number;
  name: string;
  area?: { code?: string | null } | null;
}

const STAGE_MAP: Record<string, Stage> = {
  GROUP_STAGE: 'GROUP',
  LEAGUE_STAGE: 'LEAGUE',
  PLAYOFFS: 'PLAYOFF',
  KNOCKOUT_ROUND_PLAY_OFFS: 'PLAYOFF',
  LAST_16: 'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS: 'SF',
  FINAL: 'FINAL',
};

const STATUS_MAP: Record<string, MatchStatus> = {
  FINISHED: 'finished',
  AWARDED: 'finished',
  IN_PLAY: 'live',
  PAUSED: 'live',
  POSTPONED: 'postponed',
  SUSPENDED: 'postponed',
  CANCELLED: 'postponed',
  SCHEDULED: 'scheduled',
  TIMED: 'scheduled',
};

/** football-data ISO-3 alan kodları -> openfootball'un kullandığı UEFA/FIFA kodları. */
const AREA_CODES: Record<string, string> = {
  DEU: 'GER', NLD: 'NED', PRT: 'POR', CHE: 'SUI', HRV: 'CRO', GRC: 'GRE', DNK: 'DEN',
  BGR: 'BUL', SVN: 'SVN', SRB: 'SRB', MCO: 'MCO', CZE: 'CZE', AUT: 'AUT', BEL: 'BEL',
};

const complete = (s: FdScore | undefined): s is { home: number; away: number } =>
  Boolean(s) && s!.home !== null && s!.away !== null;

/**
 * Maç skoru = normal süre + uzatma. Penaltılı maçlarda fullTime penaltı
 * gollerini de içerebildiği için doğrudan kullanılmıyor.
 */
export function matchScore(score: FdMatch['score']): Score | null {
  if (!complete(score.fullTime)) return null;
  if (score.duration && score.duration !== 'REGULAR' && complete(score.regularTime)) {
    const extra = complete(score.extraTime) ? score.extraTime : { home: 0, away: 0 };
    return { home: score.regularTime.home + extra.home, away: score.regularTime.away + extra.away };
  }
  if (complete(score.penalties)) {
    const home = score.fullTime.home - score.penalties.home;
    const away = score.fullTime.away - score.penalties.away;
    if (home >= 0 && away >= 0) return { home, away };
  }
  return { home: score.fullTime.home, away: score.fullTime.away };
}

export interface NormalizeResult {
  matches: RawMatch[];
  skipped: string[];
}

export function normalizeFootballData(season: string, matches: FdMatch[], teams: FdTeam[]): NormalizeResult {
  const countryOf = new Map<number, string>();
  for (const team of teams) {
    const code = team.area?.code;
    if (code) countryOf.set(team.id, AREA_CODES[code] ?? code);
  }

  const skipped: string[] = [];
  const out: RawMatch[] = [];
  for (const m of matches) {
    const stage = STAGE_MAP[m.stage];
    // Ön eleme turları (Temmuz-Ağustos) siteye dahil değil
    if (!stage) {
      skipped.push(`${m.id}: aşama ${m.stage}`);
      continue;
    }
    // Takımı henüz belli olmayan eleme maçları (kura öncesi) atlanır
    if (!m.homeTeam.name || !m.awayTeam.name) {
      skipped.push(`${m.id}: takımlar belli değil`);
      continue;
    }
    const status = STATUS_MAP[m.status] ?? 'scheduled';
    const score = status === 'scheduled' || status === 'postponed' ? null : matchScore(m.score);
    out.push({
      season,
      stage,
      group: m.group ? m.group.replace(/^GROUP_/, '') : null,
      round: stage === 'LEAGUE' || stage === 'GROUP' ? m.matchday : null,
      kickoff: new Date(m.utcDate).toISOString(),
      timeKnown: true,
      home: { name: m.homeTeam.name, country: countryOf.get(m.homeTeam.id ?? -1) ?? null },
      away: { name: m.awayTeam.name, country: countryOf.get(m.awayTeam.id ?? -1) ?? null },
      status,
      score,
      halfTime: complete(m.score.halfTime) ? { home: m.score.halfTime.home, away: m.score.halfTime.away } : null,
      extraTime: m.score.duration === 'EXTRA_TIME' || m.score.duration === 'PENALTY_SHOOTOUT',
      penalties: complete(m.score.penalties) ? { home: m.score.penalties.home, away: m.score.penalties.away } : null,
      neutral: false,
    });
  }
  return { matches: annotateKnockouts(out), skipped };
}

async function fdGet<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { 'X-Auth-Token': token } });
  if (res.status === 429) throw new Error('football-data.org istek sınırı aşıldı (429), bir dakika sonra tekrar dene');
  if (!res.ok) throw new Error(`football-data.org ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as T;
}

/** "2026-27" -> football-data'nın sezon parametresi 2026. */
export async function fetchFootballDataSeason(season: string, token: string): Promise<NormalizeResult> {
  const year = season.slice(0, 4);
  const [matches, teams] = await Promise.all([
    fdGet<{ matches: FdMatch[] }>(`/competitions/CL/matches?season=${year}`, token),
    fdGet<{ teams: FdTeam[] }>(`/competitions/CL/teams?season=${year}`, token),
  ]);
  return normalizeFootballData(season, matches.matches, teams.teams);
}
