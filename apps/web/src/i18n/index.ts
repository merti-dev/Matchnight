import de from './de';
import en, { type Dictionary } from './en';
import tr from './tr';
import type { Locale } from './config';

const DICTIONARIES: Record<Locale, Dictionary> = { en, de, tr };

export function dictionary(locale: Locale): Dictionary {
  return DICTIONARIES[locale];
}

export type { Dictionary };
export * from './config';
