import Link from 'next/link';
import type { MatchDto } from '@matchnight/core';
import type { Dictionary, Locale } from '@/i18n';
import { formatDate } from '@/lib/format';
import { routes } from '@/lib/routes';
import { LocalTime } from './LocalTime';
import { ProbabilityBar } from './ProbabilityBar';

function stageLabel(m: MatchDto, t: Dictionary): string {
  if (m.stage === 'LEAGUE' && m.round) return t.matchday(m.round);
  if (m.stage === 'GROUP' && m.group) return t.group(m.group);
  return m.round ? `${t.stage[m.stage]} · ${t.leg(m.round)}` : t.stage[m.stage];
}

export function Score({ m, t }: { m: MatchDto; t: Dictionary }) {
  if (!m.score) {
    return <span className="muted text-sm">{m.status === 'postponed' ? t.postponed : t.vs}</span>;
  }
  return (
    <span className="inline-flex flex-col items-center leading-tight">
      <span className="tabular rounded-md px-2 py-0.5 font-semibold" style={{ background: 'var(--surface-2)' }}>
        {m.score.home}–{m.score.away}
      </span>
      {(m.extraTime || m.penalties) && (
        <span className="muted text-[10px]">{m.penalties ? t.pens(m.penalties.home, m.penalties.away) : t.aet}</span>
      )}
    </span>
  );
}

interface Props {
  m: MatchDto;
  t: Dictionary;
  locale: Locale;
  showDate?: boolean;
  /** Farklı sezonlardan maçlar listeleniyorsa yıl da görünsün. */
  withYear?: boolean;
  showStage?: boolean;
  /** Kulüp sayfasında o kulübü vurgulamak için. */
  focusTeamId?: string;
}

/** Listelerde tek maç satırı: tarih, takımlar, skor ya da olasılık çubuğu. */
export function MatchRow({ m, t, locale, showDate = true, withYear = false, showStage = true, focusTeamId }: Props) {
  const winner = m.score && m.score.home !== m.score.away ? (m.score.home > m.score.away ? 'home' : 'away') : null;
  const weight = (side: 'home' | 'away') =>
    winner === side || (focusTeamId && m[side].id === focusTeamId) ? 'font-semibold' : '';
  return (
    <li>
      <Link
        href={routes.match(locale, m.id)}
        className="grid grid-cols-[4.5rem_1fr_auto_1fr] items-center gap-x-3 rounded-lg px-2 py-2 transition hover:bg-[var(--surface-2)] sm:grid-cols-[6.5rem_1fr_auto_1fr]"
      >
        <span className="muted text-xs leading-tight">
          {showDate && <span className="block">{formatDate(m.kickoff, locale, withYear)}</span>}
          <LocalTime iso={m.kickoff} locale={locale} known={m.timeKnown} />
        </span>
        <span className={`truncate text-right text-sm ${weight('home')}`}>{m.home.name}</span>
        <Score m={m} t={t} />
        <span className={`truncate text-sm ${weight('away')}`}>{m.away.name}</span>
        {(showStage || (!m.score && m.prob)) && (
          <span className="col-span-4 mt-0.5 flex items-center gap-3">
            {showStage && <span className="muted whitespace-nowrap text-[11px]">{stageLabel(m, t)}</span>}
            {!m.score && m.prob && (
              <span className="flex-1">
                <ProbabilityBar prob={m.prob} homeName={m.home.name} awayName={m.away.name} t={t} compact />
              </span>
            )}
          </span>
        )}
      </Link>
    </li>
  );
}
