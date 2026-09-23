import { seasonLabel } from '@matchnight/core';
import { api } from '@/lib/api';
import { pageMeta, resolveLocale } from '@/lib/page';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  return pageMeta(locale, '/method', t.method.title, t.method.intro);
}

export default async function MethodPage({ params }: Params) {
  const { locale, t } = await resolveLocale(params);
  const meta = await api.meta();
  const p = meta.params;
  const ev = meta.evaluation;
  const fmt = (n: number, d = 3) => n.toLocaleString(locale, { minimumFractionDigits: d, maximumFractionDigits: d });

  return (
    <article className="max-w-3xl space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{t.method.title}</h1>
        <p className="ink-2 mt-2">{t.method.intro}</p>
      </header>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t.method.formulaTitle}</h2>
        <ul className="ink-2 list-disc space-y-1.5 pl-5">
          {t.method.formula.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t.method.paramsTitle}</h2>
        <dl className="card grid grid-cols-[1fr_auto] gap-x-6 gap-y-1.5 p-4 text-sm">
          <dt className="ink-2">{t.method.params.k}</dt><dd className="tabular text-right">{p.k}</dd>
          <dt className="ink-2">{t.method.params.homeAdvantage}</dt><dd className="tabular text-right">{p.homeAdvantage}</dd>
          <dt className="ink-2">{t.method.params.newcomer}</dt><dd className="tabular text-right">{p.newcomer}</dd>
          <dt className="ink-2">{t.method.params.seasonRegression}</dt><dd className="tabular text-right">{Math.round(p.seasonRegression * 100)}%</dd>
          <dt className="ink-2">{t.method.params.draw}</dt>
          <dd className="tabular text-right">{fmt(p.drawBase, 2)} · e^(−|Δ| / {p.drawScale})</dd>
        </dl>
      </section>

      {ev && (
        <section>
          <h2 className="mb-2 text-lg font-semibold">{t.method.backtestTitle}</h2>
          <p className="ink-2 mb-3 text-sm">
            {t.method.backtestIntro(ev.seasons.map(seasonLabel).join(', '))} (n = {ev.elo.n})
          </p>
          <div className="card overflow-x-auto">
            <table className="w-full text-sm tabular">
              <thead className="muted text-xs">
                <tr>
                  <th className="px-4 py-2 text-left font-medium">{t.method.backtestCols.method}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.method.backtestCols.logLoss}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.method.backtestCols.brier}</th>
                  <th className="px-4 py-2 text-right font-medium">{t.method.backtestCols.accuracy}</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ['uniform', ev.uniform],
                  ['base', ev.baseRates],
                  ['elo', ev.elo],
                ] as const).map(([key, e]) => (
                  <tr key={key} className={`border-t ${key === 'elo' ? 'font-semibold' : ''}`} style={{ borderColor: 'var(--line)' }}>
                    <td className="px-4 py-2">{t.method.backtestRows[key]}</td>
                    <td className="px-4 py-2 text-right">{fmt(e.logLoss)}</td>
                    <td className="px-4 py-2 text-right">{fmt(e.brier)}</td>
                    <td className="px-4 py-2 text-right">{Math.round(e.accuracy * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-2 text-lg font-semibold">{t.method.limitsTitle}</h2>
        <ul className="ink-2 list-disc space-y-1.5 pl-5">
          {t.method.limits.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>
    </article>
  );
}
