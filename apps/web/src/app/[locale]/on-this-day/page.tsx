import Link from 'next/link';
import { MatchRow } from '@/components/MatchRow';
import { api } from '@/lib/api';
import { formatMonthDay } from '@/lib/format';
import { pageMeta, resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ date?: string }> };

const VALID = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function shift(monthDay: string, days: number): string {
  const d = new Date(Date.UTC(2024, Number(monthDay.slice(0, 2)) - 1, Number(monthDay.slice(3)) + days));
  return `${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const date = (await searchParams).date;
  const md = date && VALID.test(date) ? date : null;
  return pageMeta(locale, `/on-this-day${md ? `?date=${md}` : ''}`, md ? t.onThisDay.title(formatMonthDay(md, locale)) : t.nav.onThisDay, t.onThisDay.intro);
}

export default async function OnThisDayPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const requested = (await searchParams).date;
  const data = await api.onThisDay(requested && VALID.test(requested) ? requested : undefined);
  const nowYear = new Date().getUTCFullYear();

  const byYear = new Map<number, typeof data.matches>();
  for (const m of data.matches) {
    const y = new Date(m.kickoff).getUTCFullYear();
    byYear.set(y, [...(byYear.get(y) ?? []), m]);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t.onThisDay.title(formatMonthDay(data.date, locale))}</h1>
          <p className="ink-2 mt-1 text-sm">{t.onThisDay.intro}</p>
        </div>
        <nav className="ml-auto flex gap-2 text-sm">
          <Link className="card px-3 py-1.5 hover:border-[var(--accent)]" href={routes.onThisDay(locale, shift(data.date, -1))}>
            ← {formatMonthDay(shift(data.date, -1), locale)}
          </Link>
          <Link className="card px-3 py-1.5 hover:border-[var(--accent)]" href={routes.onThisDay(locale, shift(data.date, 1))}>
            {formatMonthDay(shift(data.date, 1), locale)} →
          </Link>
        </nav>
      </div>

      {data.matches.length === 0 ? (
        <p className="card p-4 text-sm">
          {t.onThisDay.empty}{' '}
          {data.nearest && (
            <Link className="underline" href={routes.onThisDay(locale, data.nearest)}>
              {t.onThisDay.nearest}: {formatMonthDay(data.nearest, locale)}
            </Link>
          )}
        </p>
      ) : (
        [...byYear.entries()].map(([year, list]) => (
          <section key={year} className="card p-3">
            <h2 className="mb-1 flex items-baseline gap-2 px-2">
              <span className="text-lg font-bold tabular">{year}</span>
              <span className="muted text-xs">{t.onThisDay.yearsAgo(nowYear - year)}</span>
            </h2>
            <ul className="-mx-1">
              {list.map((m) => <MatchRow key={m.id} m={m} t={t} locale={locale} showDate={false} />)}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
