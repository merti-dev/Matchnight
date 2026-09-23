/**
 * API ile web arasındaki sözleşme. API controller'ları bu tipleri döner,
 * web bu tipleri okur — iki taraf aynı dosyadan beslendiği için sapma olmaz.
 */
import type { EloParams, Evaluation, Probabilities } from './elo.js';
import type { Reached } from './journey.js';
import type { StandingRow } from './standings.js';
import type { DecidedBy } from './ties.js';
import type { MatchStatus, Score, Stage } from './types.js';

export interface TeamRef {
  id: string;
  name: string;
  country: string;
}

export interface MatchDto {
  id: string;
  season: string;
  stage: Stage;
  group: string | null;
  round: number | null;
  kickoff: string;
  timeKnown: boolean;
  status: MatchStatus;
  home: TeamRef;
  away: TeamRef;
  score: Score | null;
  halfTime: Score | null;
  extraTime: boolean;
  penalties: Score | null;
  neutral: boolean;
  /** Maç öncesi Elo ve maç sonrası (oynandıysa) değerler. */
  elo: { homeBefore: number; awayBefore: number; homeAfter: number | null; awayAfter: number | null } | null;
  prob: Probabilities | null;
}

export interface EvaluationDto {
  seasons: string[];
  elo: Evaluation;
  baseRates: Evaluation;
  uniform: Evaluation;
}

export interface MetaDto {
  lastSync: string | null;
  liveSource: 'football-data' | 'openfootball' | 'none';
  /** Takvime göre içinde bulunulan sezon. */
  currentSeason: string;
  /** Verisi olan en yeni sezon (anahtar yoksa bir önceki sezon olabilir). */
  latestSeason: string | null;
  seasons: string[];
  params: EloParams;
  evaluation: EvaluationDto | null;
}

export interface SeasonSummaryDto {
  season: string;
  format: 'GROUP' | 'LEAGUE';
  matches: number;
  finished: number;
  champion: TeamRef | null;
  runnerUp: TeamRef | null;
}

export type Zone = 'r16' | 'playoff' | 'out' | 'advance' | 'third';

export interface StandingRowDto extends StandingRow {
  team: TeamRef;
  zone: Zone;
}

export interface StandingsDto {
  season: string;
  format: 'GROUP' | 'LEAGUE';
  tables: Array<{ group: string | null; rows: StandingRowDto[] }>;
}

export interface TieDto {
  stage: Stage;
  first: TeamRef;
  second: TeamRef;
  legs: MatchDto[];
  aggregate: Score | null;
  winnerId: string | null;
  decidedBy: DecidedBy | null;
}

export interface KnockoutsDto {
  season: string;
  rounds: Array<{ stage: Stage; ties: TieDto[] }>;
}

export interface MatchDetailDto {
  match: MatchDto;
  h2h: MatchDto[];
  homeForm: MatchDto[];
  awayForm: MatchDto[];
}

export interface TeamDetailDto {
  team: TeamRef;
  elo: number | null;
  /** Aktif kulüpler arasındaki sıra (son iki sezonda oynamadıysa null). */
  rank: number | null;
  lastSeason: string | null;
  journey: Array<{ season: string; reached: Reached }>;
  history: Array<{
    matchId: string;
    kickoff: string;
    rating: number;
    opponent: string;
    /** Kulübün açısından: "2-1". */
    score: string;
    result: 'W' | 'D' | 'L';
  }>;
  recent: MatchDto[];
}

export interface RankingRowDto {
  rank: number;
  team: TeamRef;
  elo: number;
  lastSeason: string;
}

export interface OnThisDayDto {
  /** "MM-DD" */
  date: string;
  matches: MatchDto[];
  /** Bu tarihte maç yoksa en yakın maç günü ("MM-DD"). */
  nearest: string | null;
}
