import { berlinToUtcIso } from './berlin-time.js';
import { annotateKnockouts } from './knockouts.js';
import type { RawMatch, Score, Stage } from './types.js';

/**
 * openfootball "football.txt" biçimindeki Şampiyonlar Ligi dosyalarını okur.
 * 2011-12'den bu yana dört farklı başlık düzeni ve beş skor biçimi var:
 *
 *   ▪ Group A / ▪ Gruppe A / ▪ Group, Matchday 1 / ▪ League, Matchday 1
 *   ▪ Playoffs, Matchday 1 / ▪ Round of 16 / ▪ Finals, Quarterfinals / ▪ Final
 *
 *   2-1 (1-0) · 0-0 · 4-1 a.e.t. (3-1, 1-0) · 4-3 pen. 1-1 a.e.t. (1-1, 0-1)
 */

const MONTHS: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DATE_RE = /^\s*(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+([A-Z][a-z]{2})\s+(\d{1,2})(?:\s+(\d{4}))?\s*$/;
const MATCH_RE = /^\s*(?:(\d{1,2})[:.](\d{2})\s+)?(.+?)\s+v\s+(.+?)(?:\s{2,}(.*))?$/;
const TEAM_RE = /^(.*?)\s*\(([A-Z]{3})\)$/;
const SCORE_RE =
  /^(?:(\d+)-(\d+)\s+pen\.\s+)?(\d+)-(\d+)(\s+a\.e\.t\.)?(?:\s+\((\d+)-(\d+)(?:,\s*(\d+)-(\d+))?\))?/;

export interface ParseResult {
  title: string;
  matches: RawMatch[];
  warnings: string[];
}

interface StageInfo {
  stage: Stage;
  group: string | null;
  round: number | null;
}

export function parseStageHeader(header: string): StageInfo | null {
  const h = header.replace(/^▪\s*/, '').trim();
  const numberIn = (s: string) => Number(/(\d+)/.exec(s)?.[1] ?? NaN);

  let m = /^(?:Group|Gruppe)\s+([A-H])$/.exec(h);
  if (m) return { stage: 'GROUP', group: m[1]!, round: null };
  if (/^Group,\s*Matchday/.test(h)) return { stage: 'GROUP', group: null, round: numberIn(h) };
  if (/^League,\s*Matchday/.test(h)) return { stage: 'LEAGUE', group: null, round: numberIn(h) };
  if (/^Playoffs/.test(h)) return { stage: 'PLAYOFF', group: null, round: numberIn(h) || null };
  m = /Round of (\d+)/.exec(h);
  if (m) return m[1] === '16' ? { stage: 'R16', group: null, round: null } : null;
  if (/Quarterfinals?$/.test(h)) return { stage: 'QF', group: null, round: null };
  if (/Semifinals?$/.test(h)) return { stage: 'SF', group: null, round: null };
  if (/Final$/.test(h)) return { stage: 'FINAL', group: null, round: null };
  return null;
}

export function parseScore(text: string): {
  score: Score;
  halfTime: Score | null;
  extraTime: boolean;
  penalties: Score | null;
} | null {
  const m = SCORE_RE.exec(text.trim());
  if (!m) return null;
  const n = (i: number) => Number(m[i]);
  const extraTime = Boolean(m[5]);
  // Parantez: uzatmada (90', İY), normal maçta (İY). İY her zaman son çift.
  let halfTime: Score | null = null;
  if (m[8] !== undefined) halfTime = { home: n(8), away: n(9) };
  else if (m[6] !== undefined && !extraTime) halfTime = { home: n(6), away: n(7) };
  return {
    score: { home: n(3), away: n(4) },
    halfTime,
    extraTime,
    penalties: m[1] !== undefined ? { home: n(1), away: n(2) } : null,
  };
}

function parseTeam(text: string): { name: string; country: string | null } {
  const m = TEAM_RE.exec(text.trim());
  return m ? { name: m[1]!.trim(), country: m[2]! } : { name: text.trim(), country: null };
}

/**
 * Tarihlerde yıl çoğu satırda yazılmaz ("Wed Sep 17"). Son bilinen yıldan
 * başlayıp, haftanın günü tutan ilk yılı seçiyoruz — bu hem yıl atlamasını
 * (Aralık -> Ocak) çözüyor hem de bozuk satırları yakalıyor.
 */
function resolveYear(weekday: string, month: number, day: number, lastYear: number): number | null {
  for (const year of [lastYear, lastYear + 1]) {
    const date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCMonth() === month - 1 && WEEKDAYS[date.getUTCDay()] === weekday) return year;
  }
  return null;
}

export function parseOpenfootball(text: string, season: string): ParseResult {
  const lines = text.split(/\r?\n/);
  const warnings: string[] = [];
  const matches: RawMatch[] = [];

  let title = '';
  let stage: StageInfo | null = null;
  let year = Number(season.slice(0, 4));
  let date: { y: number; m: number; d: number } | null = null;
  let time: { h: number; min: number } | null = null;

  lines.forEach((raw, index) => {
    const line = raw.replace(/\s+$/, '');
    if (!line.trim() || line.startsWith('#')) return;
    if (line.startsWith('=')) {
      title = line.replace(/^=\s*/, '');
      return;
    }
    if (line.trimStart().startsWith('▪')) {
      stage = parseStageHeader(line.trim());
      if (!stage) warnings.push(`satır ${index + 1}: tanınmayan aşama "${line.trim()}"`);
      time = null;
      return;
    }

    const dm = DATE_RE.exec(line);
    if (dm) {
      const month = MONTHS[dm[2]!]!;
      const day = Number(dm[3]);
      const resolved = dm[4] ? Number(dm[4]) : resolveYear(dm[1]!, month, day, year);
      if (resolved === null) {
        warnings.push(`satır ${index + 1}: tarih çözülemedi "${line.trim()}"`);
        date = null;
        return;
      }
      year = resolved;
      date = { y: resolved, m: month, d: day };
      time = null;
      return;
    }

    const mm = MATCH_RE.exec(line);
    if (!mm) {
      warnings.push(`satır ${index + 1}: tanınmayan satır "${line.trim()}"`);
      return;
    }
    if (!stage || !date) {
      warnings.push(`satır ${index + 1}: aşama/tarih olmadan maç`);
      return;
    }
    // Saat yazılmayan satırlar bir üstteki saati devralır
    if (mm[1] !== undefined) time = { h: Number(mm[1]), min: Number(mm[2]) };

    const scoreText = (mm[5] ?? '').replace(/@.*$/, '').trim();
    const parsed = scoreText ? parseScore(scoreText) : null;
    if (scoreText && !parsed) warnings.push(`satır ${index + 1}: skor okunamadı "${scoreText}"`);

    const d = date as { y: number; m: number; d: number };
    const s = stage as StageInfo;
    const t = time as { h: number; min: number } | null;
    matches.push({
      season,
      stage: s.stage,
      group: s.group,
      round: s.round,
      kickoff: t
        ? berlinToUtcIso(d.y, d.m, d.d, t.h, t.min)
        : new Date(Date.UTC(d.y, d.m - 1, d.d)).toISOString(),
      timeKnown: Boolean(t),
      home: parseTeam(mm[3]!),
      away: parseTeam(mm[4]!),
      status: parsed ? 'finished' : 'scheduled',
      score: parsed?.score ?? null,
      halfTime: parsed?.halfTime ?? null,
      extraTime: parsed?.extraTime ?? false,
      penalties: parsed?.penalties ?? null,
      neutral: false,
    });
  });

  return { title, matches: annotateKnockouts(matches), warnings };
}
