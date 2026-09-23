import type { Probabilities } from '@matchnight/core';
import type { Dictionary } from '@/i18n';
import { pct } from '@/lib/format';

interface Props {
  prob: Probabilities;
  homeName: string;
  awayName: string;
  t: Dictionary;
  /** Kompakt: maç listelerinde, açıklama satırı olmadan. */
  compact?: boolean;
}

const SEGMENTS = [
  { key: 'home', fill: 'var(--series-home)', on: 'var(--on-home)' },
  { key: 'draw', fill: 'var(--series-draw)', on: 'var(--on-draw)' },
  { key: 'away', fill: 'var(--series-away)', on: 'var(--on-away)' },
] as const;

/**
 * Üç sonuçlu olasılık çubuğu. Kurallar: dolgular arasında 2px yüzey boşluğu,
 * dış uçlar 4px yuvarlak, yüzde etiketi sadece sığdığı dilimde; bütün değerler
 * aşağıdaki açıklamada renge bağlı kalmadan metin olarak da var.
 */
export function ProbabilityBar({ prob, homeName, awayName, t, compact }: Props) {
  const names = { home: homeName, draw: t.prob.draw, away: awayName };
  const summary = t.prob.summary(homeName, pct(prob.home), pct(prob.draw), awayName, pct(prob.away));

  return (
    <div>
      <div
        role="img"
        aria-label={summary}
        className="flex w-full overflow-visible"
        style={{ gap: 2, height: compact ? 8 : 26 }}
      >
        {SEGMENTS.map((s, i) => {
          const value = prob[s.key];
          const radius = i === 0 ? '4px 0 0 4px' : i === SEGMENTS.length - 1 ? '0 4px 4px 0' : '0';
          return (
            <div
              key={s.key}
              tabIndex={compact ? -1 : 0}
              className="group relative flex items-center justify-center"
              style={{ width: `${value * 100}%`, background: s.fill, borderRadius: radius, minWidth: value > 0 ? 2 : 0 }}
            >
              {!compact && value >= 0.14 && (
                <span className="text-xs font-semibold tabular" style={{ color: s.on }}>
                  {pct(value)}
                </span>
              )}
              {!compact && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded-md px-2 py-1 text-xs shadow group-hover:block group-focus:block"
                  style={{ background: 'var(--ink)', color: 'var(--bg)' }}
                >
                  {names[s.key]} · {pct(value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!compact && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {SEGMENTS.map((s) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span aria-hidden className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: s.fill }} />
              <span className="ink-2">{names[s.key]}</span>
              <span className="font-semibold tabular">{pct(prob[s.key])}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
