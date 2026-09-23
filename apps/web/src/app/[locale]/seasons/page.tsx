import Link from 'next/link';
import { seasonLabel } from '@matchnight/core';
import { api } from '@/lib/api';
import { pageMeta, resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  return pageMeta(locale, '/seasons', t.season.allSeasons);
}

export default async function SeasonsPage({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  const seasons = await api.seasons();
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{t.season.allSeasons}</h1>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((s) => (
          <li key={s.season}>
            <Link href={routes.season(locale, s.season)} className="card block p-4 transition hover:border-[var(--accent)]">
              <p className="font-semibold">{seasonLabel(s.season)}</p>
              <p className="muted text-xs">{t.stage[s.format]}</p>
              {s.champion ? (
                <p className="mt-2 text-sm">
                  <span className="font-semibold">{s.champion.name}</span>
                  {s.runnerUp && <span className="muted"> · {s.runnerUp.name}</span>}
                </p>
              ) : (
                <p className="muted mt-2 text-sm tabular">
                  {s.finished}/{s.matches}
                </p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
