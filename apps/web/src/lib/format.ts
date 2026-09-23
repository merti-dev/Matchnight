import { INTL_LOCALE, type Locale } from '@/i18n';

export const pct = (p: number) => `${Math.round(p * 100)}%`;
export const elo = (r: number) => Math.round(r).toLocaleString('en-US');

/** Maç tarihi — Berlin saatiyle (UEFA saatleri CET/CEST'tir). */
export function formatDate(iso: string, locale: Locale, withYear = true): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: 'Europe/Berlin',
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    weekday: 'short',
  }).format(new Date(iso));
}

/** "MM-DD" -> yerel dilde "23 Eylül". */
export function formatMonthDay(monthDay: string, locale: Locale): string {
  const [m, d] = monthDay.split('-').map(Number);
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, m! - 1, d!)),
  );
}

export function formatDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    timeZone: 'Europe/Berlin',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));
}
