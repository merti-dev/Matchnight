import type { MetadataRoute } from 'next';
import { LOCALES } from '@/i18n/config';
import { api } from '@/lib/api';

export const dynamic = 'force-dynamic';

/** Arama motorları için: her sezon, maç ve kulüp sayfası, üç dilde. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const seasons = await api.seasons();
  const matches = (await Promise.all(seasons.map((s) => api.seasonMatches(s.season)))).flat().filter((m) => m !== null);
  const teams = [...new Set(matches.flatMap((m) => [m!.home.id, m!.away.id]))];
  const paths = [
    '', '/seasons', '/ranking', '/on-this-day', '/method',
    ...seasons.map((s) => `/season/${s.season}`),
    ...teams.map((id) => `/team/${id}`),
    ...matches.map((m) => `/match/${encodeURIComponent(m!.id)}`),
  ];
  return paths.map((path) => ({
    url: `${site}/en${path}`,
    alternates: { languages: Object.fromEntries(LOCALES.map((l) => [l, `${site}/${l}${path}`])) },
  }));
}
