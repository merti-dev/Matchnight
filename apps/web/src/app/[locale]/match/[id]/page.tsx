import Link from 'next/link';
import { notFound } from 'next/navigation';
import { seasonLabel, type MatchDto } from '@matchnight/core';
import { LocalTime } from '@/components/LocalTime';
import { MatchRow } from '@/components/MatchRow';
import { ProbabilityBar } from '@/components/ProbabilityBar';
import type { Dictionary, Locale } from '@/i18n';
import { api } from '@/lib/api';
import { elo, formatDate } from '@/lib/format';
import { pageMeta, resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';

type Props = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const detail = await api.match(decodeURIComponent(id));
  if (!detail) return {};
  const m = detail.match;
  return pageMeta(locale, `/match/${id}`, `${m.home.name} ${t.vs} ${m.away.name} · ${seasonLabel(m.season)}`);
}

/** Kulübün açısından G/B/M sayısı. */
function record(list: MatchDto[], teamId: string) {
  let w = 0, d = 0, l = 0;
  for (const m of list) {
    if (!m.score) continue;
    const own = m.home.id === teamId ? m.score.home : m.score.away;
    const other = m.home.id === teamId ? m.score.away : m.score.home;
    if (own > other) w++;
    else if (own < other) l++;
    else d++;
  }
  return { w, d, l };
}

function EloDelta({ before, after }: { before: number; after: number | null }) {
  const delta = after === null ? null : after - before;
  return (
    <span className="tabular">
      {elo(before)}
      {delta !== null && (
        <span className="ml-1.5 text-xs" style={{ color: delta >= 0 ? 'var(--good)' : 'var(--bad)' }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(Math.round(delta))}
        </span>
      )}
    </span>
  );
}

function FormList({ title, list, t, locale, teamId }: { title: string; list: MatchDto[]; t: Dictionary; locale: Locale; teamId: string }) {
  if (!list.length) return null;
  return (
    <section className="card p-3">
      <h2 className="mb-1 px-2 text-sm font-semibold">{title}</h2>
      <ul className="-mx-1">
        {list.map((m) => (
          <MatchRow key={m.id} m={m} t={t} locale={locale} focusTeamId={teamId} withYear />
        ))}
      </ul>
    </section>
  );
}

export default async function MatchPage({ params }: Props) {
  const { locale, t } = await resolveLocale(params);
  const { id } = await params;
  const detail = await api.match(decodeURIComponent(id));
  if (!detail) notFound();
  const { match: m, h2h, homeForm, awayForm } = detail;

  const stage =
    m.stage === 'LEAGUE' && m.round ? `${t.stage.LEAGUE} · ${t.matchday(m.round)}`
    : m.stage === 'GROUP' && m.group ? `${t.stage.GROUP} · ${t.group(m.group)}`
    : `${t.stage[m.stage]}${m.round ? ` · ${t.leg(m.round)}` : ''}`;
  const h2hRecord = record(h2h, m.home.id);

  return (
    <div className="space-y-6">
      <section className="card p-5">
        <p className="muted text-center text-xs">
          <Link href={routes.season(locale, m.season)} className="hover:underline">{seasonLabel(m.season)}</Link> · {stage}
          {m.neutral && ` · ${t.neutral}`}
        </p>
        <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          <Link href={routes.team(locale, m.home.id)} className="text-right text-lg font-bold hover:underline sm:text-2xl">{m.home.name}</Link>
          <div className="text-center">
            {m.score ? (
              <>
                <p className="tabular text-3xl font-bold sm:text-4xl">{m.score.home}–{m.score.away}</p>
                {m.halfTime && <p className="muted text-xs tabular">{t.halfTime} {m.halfTime.home}–{m.halfTime.away}</p>}
                {m.penalties ? <p className="text-xs">{t.pens(m.penalties.home, m.penalties.away)}</p> : m.extraTime ? <p className="text-xs">{t.aet}</p> : null}
              </>
            ) : (
              <p className="muted text-lg">{m.status === 'postponed' ? t.postponed : t.vs}</p>
            )}
          </div>
          <Link href={routes.team(locale, m.away.id)} className="text-lg font-bold hover:underline sm:text-2xl">{m.away.name}</Link>
        </div>
        <p className="muted mt-3 text-center text-sm">
          {formatDate(m.kickoff, locale)} · <LocalTime iso={m.kickoff} locale={locale} known={m.timeKnown} />
        </p>
      </section>

      {m.prob && m.elo && (
        <section className="card p-5">
          <h2 className="mb-3 font-semibold">{t.prob.title}</h2>
          <ProbabilityBar prob={m.prob} homeName={m.home.name} awayName={m.away.name} t={t} />
          <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="muted text-xs">{t.match.eloBefore} · {m.home.name}</dt>
              <dd><EloDelta before={m.elo.homeBefore} after={m.elo.homeAfter} /></dd>
            </div>
            <div>
              <dt className="muted text-xs">{t.match.eloBefore} · {m.away.name}</dt>
              <dd><EloDelta before={m.elo.awayBefore} after={m.elo.awayAfter} /></dd>
            </div>
          </dl>
          <p className="muted mt-3 text-xs">
            {t.prob.caption} <Link className="underline" href={routes.method(locale)}>{t.nav.method}</Link>
          </p>
        </section>
      )}

      <section className="card p-3">
        <div className="mb-1 flex items-baseline justify-between px-2">
          <h2 className="text-sm font-semibold">{t.match.h2h}</h2>
          {h2h.length > 0 && <span className="muted text-xs tabular">{m.home.name}: {t.match.record(h2hRecord.w, h2hRecord.d, h2hRecord.l)}</span>}
        </div>
        {h2h.length ? (
          <ul className="-mx-1">
            {h2h.map((x) => <MatchRow key={x.id} m={x} t={t} locale={locale} withYear />)}
          </ul>
        ) : (
          <p className="muted px-2 py-2 text-sm">{t.match.noH2h}</p>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <FormList title={t.match.form(m.home.name)} list={homeForm} t={t} locale={locale} teamId={m.home.id} />
        <FormList title={t.match.form(m.away.name)} list={awayForm} t={t} locale={locale} teamId={m.away.id} />
      </div>
    </div>
  );
}
