import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { dictionary, isLocale, LOCALES, type Locale } from '@/i18n';

/** URL'deki dil parçasını doğrular; geçersizse 404. */
export async function resolveLocale(params: Promise<{ locale: string }>): Promise<{ locale: Locale; t: ReturnType<typeof dictionary> }> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return { locale, t: dictionary(locale) };
}

/** Başlık + her dil için hreflang alternatifleri (SEO). */
export function pageMeta(locale: Locale, path: string, title: string, description?: string): Metadata {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return {
    title: `${title} · Matchnight`,
    description,
    alternates: {
      canonical: `${site}/${locale}${path}`,
      languages: Object.fromEntries(LOCALES.map((l) => [l, `${site}/${l}${path}`])),
    },
  };
}
