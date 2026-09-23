import type { Locale } from '@/i18n';

/** Bütün iç linkler buradan: yol yapısı değişirse tek yerde değişir. */
export const routes = {
  home: (l: Locale) => `/${l}`,
  season: (l: Locale, season: string, view?: 'table' | 'matches' | 'knockout') => `/${l}/season/${season}${view ? `?view=${view}` : ''}`,
  seasons: (l: Locale) => `/${l}/seasons`,
  match: (l: Locale, id: string) => `/${l}/match/${encodeURIComponent(id)}`,
  team: (l: Locale, id: string) => `/${l}/team/${encodeURIComponent(id)}`,
  ranking: (l: Locale) => `/${l}/ranking`,
  onThisDay: (l: Locale, date?: string) => `/${l}/on-this-day${date ? `?date=${date}` : ''}`,
  method: (l: Locale) => `/${l}/method`,
  imprint: (l: Locale) => `/${l}/legal/imprint`,
  privacy: (l: Locale) => `/${l}/legal/privacy`,
};
