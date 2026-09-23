/** Turnuva aşamaları, kronolojik sırayla. */
export const STAGES = ['GROUP', 'LEAGUE', 'PLAYOFF', 'R16', 'QF', 'SF', 'FINAL'] as const;
export type Stage = (typeof STAGES)[number];

export type MatchStatus = 'finished' | 'scheduled' | 'live' | 'postponed';

export interface Score {
  home: number;
  away: number;
}

export interface Match {
  /** Kaynaktan bağımsız, kararlı kimlik: sezon + tarih + takımlar. */
  id: string;
  season: string; // "2025-26"
  stage: Stage;
  /** Grup harfi (A-H) — yalnızca GROUP aşamasında. */
  group: string | null;
  /** Lig aşamasında hafta, eleme turlarında ayak (1/2). */
  round: number | null;
  /** UTC ISO zaman. Saat bilinmiyorsa günün 00:00'ı ve timeKnown=false. */
  kickoff: string;
  timeKnown: boolean;
  homeId: string;
  awayId: string;
  status: MatchStatus;
  /** Maçın sonucu: uzatma oynandıysa uzatma sonrası skor. */
  score: Score | null;
  halfTime: Score | null;
  extraTime: boolean;
  /** Penaltı atışları — sadece eşleşmeyi belirler, maç sonucunu değil. */
  penalties: Score | null;
  /** Tarafsız saha (finaller, tek maçlık eleme turları). */
  neutral: boolean;
}

export interface Team {
  id: string;
  name: string;
  country: string; // ISO-3 benzeri UEFA kodu: GER, ESP, TUR...
}

/** Kaynak adaptörlerinin ürettiği ara biçim; takım kimliği henüz çözülmemiş. */
export interface RawMatch extends Omit<Match, 'id' | 'homeId' | 'awayId'> {
  home: { name: string; country: string | null };
  away: { name: string; country: string | null };
}
