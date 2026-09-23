import Link from 'next/link';
import { notFound } from 'next/navigation';
import { seasonLabel } from '@matchnight/core';
import { EloChart } from '@/components/EloChart';
import { MatchRow } from '@/components/MatchRow';
import { INTL_LOCALE } from '@/i18n';
import { api } from '@/lib/api';
import { elo } from '@/lib/format';
import { pageMeta, resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale } = await resolveLocale(params);
  const { id } = await params;
  const team = await api.team(decodeURIComponent(id));
  return team ? pageMeta(locale, `/team/${id}`, `${team.team.name} · Champions League`) : {};
}

export default async function TeamPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const data = await api.team(decodeURIComponent(id));
  if (!data) notFound();

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div>
          <p className="muted text-xs">{data.team.country} · {t.team.seasons(data.journey.length)}</p>
          <h1 className="text-3xl font-bold tracking-tight">{data.team.name}</h1>
        </div>
        {data.elo !== null && (
          <dl className="flex gap-8">
            <div>
              <dt className="muted text-xs">{t.team.rating}</dt>
              <dd className="text-2xl font-bold tabular">{elo(data.elo)}</dd>
            </div>
            <div>
              <dt className="muted text-xs">{t.team.rank}</dt>
              <dd className="text-2xl font-bold tabular">{data.rank ?? '—'}</dd>
            </div>
          </dl>
        )}
        {data.rank === null && <p className="muted text-sm">{t.team.inactive}</p>}
      </section>

      {data.history.length > 1 && (
        <section className="card p-4">
          <h2 className="font-semibold">{t.team.history}</h2>
          <p className="muted mb-3 text-xs">{t.team.historyCaption}</p>
          <EloChart
            points={data.history}
            locale={INTL_LOCALE[locale]}
            labels={{ rating: t.team.rating, table: t.team.tableView, date: t.team.date, opponent: t.team.match, result: t.resultLetter }}
          />
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="card p-4">
          <h2 className="mb-2 font-semibold">{t.team.journey}</h2>
          <ol className="space-y-1 text-sm">
            {data.journey.map((j) => (
              <li key={j.season} className="flex justify-between gap-3">
                <Link href={routes.season(locale, j.season)} className="muted tabular hover:underline">{seasonLabel(j.season)}</Link>
                <span className={j.reached === 'WINNER' ? 'font-semibold' : ''} style={j.reached === 'WINNER' ? { color: 'var(--accent)' } : undefined}>
                  {j.reached === 'WINNER' ? '🏆 ' : ''}{t.reached[j.reached]}
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section className="card p-3">
          <h2 className="mb-1 px-2 font-semibold">{t.team.recent}</h2>
          <ul className="-mx-1">
            {data.recent.map((m) => <MatchRow key={m.id} m={m} t={t} locale={locale} focusTeamId={data.team.id} withYear />)}
          </ul>
        </section>
      </div>
    </div>
  );
}
