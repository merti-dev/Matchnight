import Link from 'next/link';
import { seasonLabel } from '@matchnight/core';
import { MatchRow } from '@/components/MatchRow';
import { api } from '@/lib/api';
import { elo, formatMonthDay } from '@/lib/format';
import { pageMeta, resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  return pageMeta(locale, '', 'Champions League', t.brandTagline);
}

export default async function HomePage({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  const [meta, upcoming, ranking, today, seasons] = await Promise.all([
    api.meta(),
    api.upcoming(8),
    api.ranking(),
    api.onThisDay(),
    api.seasons(),
  ]);
  const latest = upcoming.length ? [] : await api.latest(8);
  const lastChampion = seasons.find((s) => s.champion);
  const missing = meta.latestSeason && meta.currentSeason !== meta.latestSeason;

  return (
    <div className="space-y-8">
      {missing && (
        <p className="card px-4 py-3 text-sm" style={{ borderColor: 'var(--accent)' }}>
          {t.home.seasonMissing(seasonLabel(meta.currentSeason), seasonLabel(meta.latestSeason!))}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card p-4">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="font-semibold">{upcoming.length ? t.home.upcoming : t.home.latest}</h2>
            {meta.latestSeason && (
              <Link href={routes.season(locale, meta.latestSeason)} className="muted text-sm hover:text-[var(--ink)]">
                {seasonLabel(meta.latestSeason)} →
              </Link>
            )}
          </div>
          <ul className="-mx-2">
            {(upcoming.length ? upcoming : latest).map((m) => (
              <MatchRow key={m.id} m={m} t={t} locale={locale} />
            ))}
          </ul>
        </section>

        <aside className="space-y-6">
          {lastChampion?.champion && (
            <Link href={routes.season(locale, lastChampion.season, 'knockout')} className="card block p-4 transition hover:border-[var(--accent)]">
              <p className="muted text-xs uppercase tracking-wider">{t.home.champion(seasonLabel(lastChampion.season))}</p>
              <p className="mt-1 text-xl font-bold">{lastChampion.champion.name}</p>
              {lastChampion.runnerUp && <p className="muted text-sm">{t.reached.FINAL}: {lastChampion.runnerUp.name}</p>}
            </Link>
          )}

          <section className="card p-4">
            <h2 className="mb-2 font-semibold">{t.home.topElo}</h2>
            <ol className="space-y-1 text-sm tabular">
              {ranking.slice(0, 10).map((r) => (
                <li key={r.team.id} className="flex items-center gap-2">
                  <span className="muted w-5 text-right">{r.rank}</span>
                  <Link href={routes.team(locale, r.team.id)} className="flex-1 truncate hover:underline">
                    {r.team.name}
                  </Link>
                  <span className="font-medium">{elo(r.elo)}</span>
                </li>
              ))}
            </ol>
            <Link href={routes.ranking(locale)} className="muted mt-2 inline-block text-sm hover:text-[var(--ink)]">
              {t.home.fullRanking}
            </Link>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 font-semibold">
              {t.home.onThisDay} · {formatMonthDay(today.date, locale)}
            </h2>
            {today.matches.length ? (
              <ul className="space-y-1 text-sm">
                {today.matches.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    <Link href={routes.match(locale, m.id)} className="flex gap-2 hover:underline">
                      <span className="muted tabular">{m.season.slice(0, 4)}</span>
                      <span className="truncate">
                        {m.home.name} {m.score?.home}–{m.score?.away} {m.away.name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted text-sm">
                {t.onThisDay.empty}{' '}
                {today.nearest && (
                  <Link className="underline" href={routes.onThisDay(locale, today.nearest)}>
                    {t.onThisDay.nearest}: {formatMonthDay(today.nearest, locale)}
                  </Link>
                )}
              </p>
            )}
            <Link href={routes.onThisDay(locale)} className="muted mt-2 inline-block text-sm hover:text-[var(--ink)]">
              {t.home.more}
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
