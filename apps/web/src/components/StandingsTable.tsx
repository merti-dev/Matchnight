import Link from 'next/link';
import type { StandingRowDto } from '@matchnight/core';
import type { Dictionary, Locale } from '@/i18n';
import { routes } from '@/lib/routes';

const ZONE_COLOR: Record<string, string | undefined> = {
  r16: 'var(--zone-1)',
  advance: 'var(--zone-1)',
  playoff: 'var(--zone-2)',
};

export function StandingsTable({ rows, t, locale, legend }: { rows: StandingRowDto[]; t: Dictionary; locale: Locale; legend?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm tabular">
        <thead className="muted text-xs">
          <tr>
            <th className="w-10 py-2 pl-3 pr-2 text-left font-medium">{t.table.pos}</th>
            <th className="py-2 text-left font-medium">{t.table.team}</th>
            {(['p', 'w', 'd', 'l'] as const).map((k) => (
              <th key={k} className="hidden w-9 py-2 text-right font-medium sm:table-cell">
                {t.table[k]}
              </th>
            ))}
            <th className="w-14 py-2 text-right font-medium">{t.table.gd}</th>
            <th className="w-12 py-2 pr-3 text-right font-medium">{t.table.pts}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.team.id} className="border-t" style={{ borderColor: 'var(--line)' }}>
              <td className="py-1.5 pl-3 pr-2" style={{ boxShadow: ZONE_COLOR[r.zone] ? `inset 3px 0 0 ${ZONE_COLOR[r.zone]}` : undefined }}>
                {r.position}
              </td>
              <td className="py-1.5">
                <Link href={routes.team(locale, r.team.id)} className="hover:underline">
                  {r.team.name}
                </Link>
                <span className="muted ml-1.5 text-[11px]">{r.team.country}</span>
              </td>
              <td className="hidden py-1.5 text-right sm:table-cell">{r.played}</td>
              <td className="hidden py-1.5 text-right sm:table-cell">{r.won}</td>
              <td className="hidden py-1.5 text-right sm:table-cell">{r.drawn}</td>
              <td className="hidden py-1.5 text-right sm:table-cell">{r.lost}</td>
              <td className="py-1.5 text-right">{r.goalDiff > 0 ? `+${r.goalDiff}` : r.goalDiff}</td>
              <td className="py-1.5 pr-3 text-right font-semibold">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {legend && (
        <ul className="muted mt-2 flex flex-wrap gap-x-4 gap-y-1 px-3 text-xs">
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-[3px]" style={{ background: 'var(--zone-1)' }} />
            1–8 · {t.zones.r16}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-3 w-[3px]" style={{ background: 'var(--zone-2)' }} />
            9–24 · {t.zones.playoff}
          </li>
          <li>25–36 · {t.zones.out}</li>
        </ul>
      )}
    </div>
  );
}
