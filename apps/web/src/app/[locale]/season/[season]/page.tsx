import Link from 'next/link';
import { notFound } from 'next/navigation';
import { seasonLabel, type MatchDto, type TieDto } from '@matchnight/core';
import { MatchRow } from '@/components/MatchRow';
import { StandingsTable } from '@/components/StandingsTable';
import type { Dictionary, Locale } from '@/i18n';
import { api } from '@/lib/api';
import { pageMeta, resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';

type View = 'table' | 'matches' | 'knockout';
type Props = { params: Promise<{ locale: string; season: string }>; searchParams: Promise<{ view?: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { season } = await params;
  return pageMeta(locale, `/season/${season}`, t.season.title(seasonLabel(season)));
}

/** Deplasman golü, uzatma, penaltı gibi dikkat çekici durumlar; sıradan toplam skor notu gösterilmez. */
const NOTABLE = new Set(['away-goals', 'extra-time', 'penalties']);

/** Eleme eşleşmesi kartı: her takım kendi satırında, toplam skor sağda (bracket düzeni). */
function Tie({ tie, t, locale }: { tie: TieDto; t: Dictionary; locale: Locale }) {
  const single = tie.legs.length === 1;
  const goals = (side: 'first' | 'second') => {
    if (single) {
      const m = tie.legs[0]!;
      if (!m.score) return null;
      return m.home.id === tie[side].id ? m.score.home : m.score.away;
    }
    return tie.aggregate ? (side === 'first' ? tie.aggregate.home : tie.aggregate.away) : null;
  };
  const penalties = single ? tie.legs[0]!.penalties : tie.legs.at(-1)?.penalties ?? null;
  const pens = (side: 'first' | 'second') => {
    if (!penalties) return null;
    const lastHome = tie.legs.at(-1)!.home.id;
    return lastHome === tie[side].id ? penalties.home : penalties.away;
  };

  return (
    <li className="card p-3">
      {(['first', 'second'] as const).map((side) => {
        const won = tie.winnerId === tie[side].id;
        return (
          <div key={side} className="flex items-center gap-2 py-0.5 text-sm">
            <Link href={routes.team(locale, tie[side].id)} className={`min-w-0 flex-1 truncate hover:underline ${won ? 'font-semibold' : 'ink-2'}`}>
              {tie[side].name}
            </Link>
            {pens(side) !== null && <span className="muted text-xs tabular">({pens(side)})</span>}
            <span className={`w-6 text-right tabular ${won ? 'font-semibold' : 'ink-2'}`}>{goals(side) ?? '–'}</span>
          </div>
        );
      })}
      {tie.decidedBy && NOTABLE.has(tie.decidedBy) && (
        <p className="muted mt-1 text-[11px]">{t.decidedBy[tie.decidedBy]}</p>
      )}
      <ul className="muted mt-2 space-y-0.5 border-t pt-2 text-xs tabular" style={{ borderColor: 'var(--line)' }}>
        {tie.legs.map((leg) => (
          <li key={leg.id}>
            <Link href={routes.match(locale, leg.id)} className="hover:underline">
              {leg.round ? `${t.leg(leg.round)}: ` : ''}
              {leg.home.name} {leg.score ? `${leg.score.home}–${leg.score.away}` : t.vs} {leg.away.name}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}

function groupRounds(matches: MatchDto[], t: Dictionary): Array<[string, MatchDto[]]> {
  const groups = new Map<string, MatchDto[]>();
  for (const m of matches) {
    const key =
      m.stage === 'LEAGUE' && m.round
        ? t.matchday(m.round)
        : m.stage === 'GROUP'
          ? `${t.stage.GROUP}${m.round ? ` · ${t.matchday(m.round)}` : ''}`
          : `${t.stage[m.stage]}${m.round ? ` · ${t.leg(m.round)}` : ''}`;
    groups.set(key, [...(groups.get(key) ?? []), m]);
  }
  return [...groups.entries()];
}

export default async function SeasonPage({ params, searchParams }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { season } = await params;
  const requested = (await searchParams).view;
  const view: View = requested === 'matches' || requested === 'knockout' ? requested : 'table';

  const [standings, knockouts, matches, seasons] = await Promise.all([
    api.standings(season),
    view === 'knockout' ? api.knockouts(season) : null,
    view === 'matches' ? api.seasonMatches(season) : null,
    api.seasons(),
  ]);
  if (!standings) notFound();

  const tabs: Array<[View, string]> = [
    ['table', t.season.tabs.table],
    ['matches', t.season.tabs.matches],
    ['knockout', t.season.tabs.knockout],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{t.season.title(seasonLabel(season))}</h1>
        <nav aria-label={t.nav.seasons} className="ml-auto flex max-w-full gap-1 overflow-x-auto text-xs">
          {seasons.map((s) => (
            <Link
              key={s.season}
              href={routes.season(locale, s.season, view)}
              aria-current={s.season === season ? 'page' : undefined}
              className={`whitespace-nowrap rounded-md px-2 py-1 tabular ${s.season === season ? 'font-semibold' : 'muted hover:text-[var(--ink)]'}`}
              style={s.season === season ? { background: 'var(--accent-fill)', color: 'var(--accent-ink)' } : undefined}
            >
              {s.season.slice(2).replace('-', '/')}
            </Link>
          ))}
        </nav>
      </div>

      <nav className="flex gap-1 border-b text-sm" style={{ borderColor: 'var(--line)' }}>
        {tabs.map(([key, label]) => (
          <Link
            key={key}
            href={routes.season(locale, season, key)}
            aria-current={view === key ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-2 ${view === key ? 'font-semibold' : 'muted border-transparent hover:text-[var(--ink)]'}`}
            style={view === key ? { borderColor: 'var(--accent)' } : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>

      {view === 'table' &&
        (standings.format === 'LEAGUE' ? (
          <section className="card py-2">
            <StandingsTable rows={standings.tables[0]!.rows} t={t} locale={locale} legend />
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {standings.tables.map((table) => (
              <section key={table.group} className="card py-2">
                <h2 className="px-3 pb-1 pt-1 text-sm font-semibold">{t.group(table.group!)}</h2>
                <StandingsTable rows={table.rows} t={t} locale={locale} />
              </section>
            ))}
          </div>
        ))}

      {view === 'matches' && matches && (
        <div className="space-y-5">
          {groupRounds(matches, t).map(([label, list]) => (
            <section key={label} className="card p-3">
              <h2 className="mb-1 px-2 text-sm font-semibold">{label}</h2>
              <ul className="-mx-1">
                {list.map((m) => (
                  <MatchRow key={m.id} m={m} t={t} locale={locale} showStage={false} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {view === 'knockout' &&
        (knockouts && knockouts.rounds.length ? (
          <div className="space-y-6">
            {knockouts.rounds.map((round) => (
              <section key={round.stage}>
                <h2 className="mb-2 font-semibold">{t.stage[round.stage]}</h2>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {round.ties.map((tie) => (
                    <Tie key={tie.legs[0]!.id} tie={tie} t={t} locale={locale} />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        ) : (
          <p className="muted">{t.season.noKnockout}</p>
        ))}
    </div>
  );
}
