import type { Match } from './types.js';

/**
 * Şampiyonlar Ligi'ne özel Elo. Formül tamamen açık, sitede /method sayfasında
 * da aynen anlatılıyor:
 *
 *   beklenen skor  E = 1 / (1 + 10^(-(R_ev + H - R_dep) / 400))    (tarafsız sahada H = 0)
 *   yeni puan      R' = R + K · G · (S - E)
 *   gol çarpanı    G = 1 (fark ≤ 1), 1.5 (fark 2), (11 + fark) / 8 (fark ≥ 3)
 *
 * Penaltılar maç sonucunu değil eşleşmeyi belirlediği için Elo'da beraberlik sayılır.
 * Her yeni sezon başında puanlar ortalamaya doğru çekilir (kadrolar değişir).
 */

export interface EloParams {
  k: number;
  homeAdvantage: number;
  /** Veride ilk kez görünen kulübün başlangıç puanı. */
  newcomer: number;
  /** Sezon başında ortalamaya çekme oranı: 0 = hiç, 1 = herkes sıfırlanır. */
  seasonRegression: number;
  /** Beraberlik olasılığı modeli: pD = drawBase · exp(-|fark| / drawScale). */
  drawBase: number;
  drawScale: number;
}

/**
 * scripts/backtest.ts ile 2013-14 … 2022-23 sezonlarında seçildi (log loss 0.929).
 * Hiç görmediği 2023-24 … 2025-26 sezonlarında (503 maç): log loss 0.933, isabet %59.6.
 * Karşılaştırma: geçmiş sonuç frekansları 1.021 / %49.9, eşit olasılık 1.099.
 */
export const DEFAULT_PARAMS: EloParams = {
  k: 40,
  homeAdvantage: 50,
  newcomer: 1300,
  seasonRegression: 0.1,
  drawBase: 0.27,
  drawScale: 500,
};

export const MEAN = 1500;

export interface Probabilities {
  home: number;
  draw: number;
  away: number;
}

export interface MatchRating {
  matchId: string;
  homeBefore: number;
  awayBefore: number;
  homeAfter: number | null;
  awayAfter: number | null;
  prob: Probabilities;
}

export interface EloResult {
  ratings: Map<string, number>;
  perMatch: Map<string, MatchRating>;
  /** Takım başına maç sonrası puan geçmişi (grafik için). */
  history: Map<string, Array<{ matchId: string; kickoff: string; rating: number }>>;
}

export function expectedHome(diff: number): number {
  return 1 / (1 + 10 ** (-diff / 400));
}

export function goalMultiplier(goalDiff: number): number {
  const d = Math.abs(goalDiff);
  if (d <= 1) return 1;
  if (d === 2) return 1.5;
  return (11 + d) / 8;
}

/**
 * Elo beklenen skoru (E = P(ev) + P(beraberlik)/2) üç sonuca bölünür. Beraberlik
 * olasılığı güç farkı büyüdükçe azalır; katsayılar backtest ile seçildi.
 */
export function probabilities(diff: number, params: EloParams = DEFAULT_PARAMS): Probabilities {
  const e = expectedHome(diff);
  let draw = params.drawBase * Math.exp(-Math.abs(diff) / params.drawScale);
  // E'nin iki tarafına da yarım beraberlik sığmalı
  draw = Math.min(draw, 2 * e, 2 * (1 - e));
  const home = Math.max(0, e - draw / 2);
  const away = Math.max(0, 1 - e - draw / 2);
  const total = home + draw + away;
  return { home: home / total, draw: draw / total, away: away / total };
}

export function runElo(matches: Match[], params: EloParams = DEFAULT_PARAMS): EloResult {
  const ordered = [...matches].sort((a, b) => a.kickoff.localeCompare(b.kickoff) || a.id.localeCompare(b.id));
  const ratings = new Map<string, number>();
  const perMatch = new Map<string, MatchRating>();
  const history = new Map<string, Array<{ matchId: string; kickoff: string; rating: number }>>();

  let season: string | null = null;
  const get = (id: string) => ratings.get(id) ?? params.newcomer;

  for (const m of ordered) {
    if (m.season !== season) {
      if (season !== null) {
        for (const [id, r] of ratings) ratings.set(id, MEAN + (r - MEAN) * (1 - params.seasonRegression));
      }
      season = m.season;
    }

    const home = get(m.homeId);
    const away = get(m.awayId);
    const diff = home - away + (m.neutral ? 0 : params.homeAdvantage);
    const prob = probabilities(diff, params);

    if (m.status !== 'finished' || !m.score) {
      perMatch.set(m.id, { matchId: m.id, homeBefore: home, awayBefore: away, homeAfter: null, awayAfter: null, prob });
      continue;
    }

    const gd = m.score.home - m.score.away;
    const s = gd > 0 ? 1 : gd < 0 ? 0 : 0.5;
    const delta = params.k * goalMultiplier(gd) * (s - expectedHome(diff));
    const homeAfter = home + delta;
    const awayAfter = away - delta;
    ratings.set(m.homeId, homeAfter);
    ratings.set(m.awayId, awayAfter);
    perMatch.set(m.id, { matchId: m.id, homeBefore: home, awayBefore: away, homeAfter, awayAfter, prob });

    for (const [id, r] of [[m.homeId, homeAfter], [m.awayId, awayAfter]] as const) {
      const list = history.get(id) ?? [];
      list.push({ matchId: m.id, kickoff: m.kickoff, rating: r });
      history.set(id, list);
    }
  }

  return { ratings, perMatch, history };
}

export type Outcome = 'home' | 'draw' | 'away';

export function outcomeOf(m: Match): Outcome | null {
  if (!m.score) return null;
  if (m.score.home > m.score.away) return 'home';
  if (m.score.home < m.score.away) return 'away';
  return 'draw';
}

export interface Evaluation {
  n: number;
  logLoss: number;
  brier: number;
  accuracy: number;
}

/** Olasılık tahminlerinin kalitesi: log loss ve Brier ne kadar düşükse o kadar iyi. */
export function evaluate(pairs: Array<{ prob: Probabilities; outcome: Outcome }>): Evaluation {
  let ll = 0;
  let brier = 0;
  let correct = 0;
  for (const { prob, outcome } of pairs) {
    const p = Math.max(prob[outcome], 1e-9);
    ll -= Math.log(p);
    for (const o of ['home', 'draw', 'away'] as const) brier += (prob[o] - (o === outcome ? 1 : 0)) ** 2;
    const pick = (['home', 'draw', 'away'] as const).reduce((a, b) => (prob[b] > prob[a] ? b : a));
    if (pick === outcome) correct++;
  }
  const n = pairs.length || 1;
  return { n: pairs.length, logLoss: ll / n, brier: brier / n, accuracy: correct / n };
}
