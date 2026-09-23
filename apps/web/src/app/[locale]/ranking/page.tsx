import Link from 'next/link';
import { seasonLabel } from '@matchnight/core';
import { api } from '@/lib/api';
import { elo } from '@/lib/format';
import { pageMeta, resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  return pageMeta(locale, '/ranking', t.ranking.title, t.ranking.intro);
}

export default async function RankingPage({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  const rows = await api.ranking();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t.ranking.title}</h1>
        <p className="ink-2 mt-1 max-w-2xl text-sm">{t.ranking.intro}</p>
      </div>
      <section className="card overflow-x-auto py-2">
        <table className="w-full text-sm tabular">
          <thead className="muted text-xs">
            <tr>
              <th className="w-10 py-2 pl-4 text-left font-medium">#</th>
              <th className="py-2 text-left font-medium">{t.table.team}</th>
              <th className="py-2 text-left font-medium">{t.ranking.lastSeason}</th>
              <th className="py-2 pr-4 text-right font-medium">{t.ranking.rating}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.team.id} className="border-t" style={{ borderColor: 'var(--line)' }}>
                <td className="py-1.5 pl-4">{r.rank}</td>
                <td className="py-1.5">
                  <Link href={routes.team(locale, r.team.id)} className="hover:underline">{r.team.name}</Link>
                  <span className="muted ml-1.5 text-[11px]">{r.team.country}</span>
                </td>
                <td className="muted py-1.5">{seasonLabel(r.lastSeason)}</td>
                <td className="py-1.5 pr-4 text-right font-semibold">{elo(r.elo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
