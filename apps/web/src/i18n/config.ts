export const LOCALES = ['en', 'de', 'tr'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Intl için tam yerel ayar. */
export const INTL_LOCALE: Record<Locale, string> = { en: 'en-GB', de: 'de-DE', tr: 'tr-TR' };
