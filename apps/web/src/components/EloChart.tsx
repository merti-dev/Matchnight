'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export interface EloPoint {
  kickoff: string;
  rating: number;
  opponent: string;
  score: string;
  result: 'W' | 'D' | 'L';
}

interface Props {
  points: EloPoint[];
  locale: string;
  labels: { rating: string; table: string; date: string; opponent: string; result: Record<'W' | 'D' | 'L', string> };
}

const HEIGHT = 220;
const PAD = { top: 12, right: 12, bottom: 26, left: 44 };

/** Temiz eksen aralıkları: 25/50/100'ün katları. */
function niceTicks(min: number, max: number, count = 4): number[] {
  const raw = (max - min) / count;
  const step = [25, 50, 100, 200].find((s) => s >= raw) ?? 200;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  // Son işaret en büyük değerin üstünde ya da ona eşit olana kadar: çizgi asla alanın dışına taşmaz
  for (let v = start; ; v += step) {
    ticks.push(v);
    if (v >= max) break;
  }
  return ticks;
}

/**
 * Tek seri çizgi grafik (kulübün Elo'su). Tek seri olduğu için lejant yok,
 * başlık neyi gösterdiğini söylüyor. Üzerine gelince dikey imleç + ipucu;
 * aynı veri erişilebilirlik için tablo olarak da açılabiliyor.
 */
export function EloChart({ points, locale, labels }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  const [hover, setHover] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry!.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const geo = useMemo(() => {
    const times = points.map((p) => new Date(p.kickoff).getTime());
    const values = points.map((p) => p.rating);
    const t0 = Math.min(...times);
    const t1 = Math.max(...times);
    const ticks = niceTicks(Math.min(...values), Math.max(...values));
    const v0 = ticks[0]!;
    const v1 = ticks.at(-1)!;
    const innerW = width - PAD.left - PAD.right;
    const innerH = HEIGHT - PAD.top - PAD.bottom;
    const x = (t: number) => PAD.left + (t1 === t0 ? innerW / 2 : ((t - t0) / (t1 - t0)) * innerW);
    const y = (v: number) => PAD.top + (1 - (v - v0) / (v1 - v0 || 1)) * innerH;
    const xy = points.map((p, i) => ({ x: x(times[i]!), y: y(p.rating) }));
    // Sezon başlangıçları (Ağustos) x ekseni işaretleri
    const years: number[] = [];
    for (let yr = new Date(t0).getUTCFullYear(); yr <= new Date(t1).getUTCFullYear(); yr++) {
      const t = Date.UTC(yr, 7, 1);
      if (t >= t0 && t <= t1) years.push(t);
    }
    const every = Math.max(1, Math.ceil(years.length / Math.floor(innerW / 64)));
    // Kulübün katılmadığı sezonlarda (200 günden uzun boşluk) çizgi kopar: arada maç yokken süreklilik varmış gibi görünmesin
    const GAP = 200 * 86_400_000;
    const path = xy
      .map((p, i) => `${i === 0 || times[i]! - times[i - 1]! > GAP ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
      .join('');
    return { xy, ticks, y, x, years: years.filter((_, i) => i % every === 0), path };
  }, [points, width]);

  const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Berlin' });

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    let best = 0;
    geo.xy.forEach((p, i) => {
      if (Math.abs(p.x - px) < Math.abs(geo.xy[best]!.x - px)) best = i;
    });
    setHover(best);
  };

  const active = hover !== null ? points[hover] : null;
  const activeXY = hover !== null ? geo.xy[hover] : null;

  return (
    <div ref={wrap} className="relative w-full">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={labels.rating}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        className="block touch-none"
      >
        {geo.ticks.map((v) => (
          <g key={v}>
            <line x1={PAD.left} x2={width - PAD.right} y1={geo.y(v)} y2={geo.y(v)} stroke="var(--grid)" strokeWidth={1} />
            <text x={PAD.left - 8} y={geo.y(v)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--muted)" className="tabular">
              {v}
            </text>
          </g>
        ))}
        {geo.years.map((t) => (
          <text key={t} x={geo.x(t)} y={HEIGHT - 6} textAnchor="middle" fontSize={11} fill="var(--muted)">
            {`${String(new Date(t).getUTCFullYear()).slice(2)}/${String(new Date(t).getUTCFullYear() + 1).slice(2)}`}
          </text>
        ))}
        <path d={geo.path} fill="none" stroke="var(--series-home)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        {activeXY && (
          <g>
            <line x1={activeXY.x} x2={activeXY.x} y1={PAD.top} y2={HEIGHT - PAD.bottom} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />
            <circle cx={activeXY.x} cy={activeXY.y} r={5} fill="var(--series-home)" stroke="var(--surface)" strokeWidth={2} />
          </g>
        )}
      </svg>
      {active && activeXY && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 rounded-md px-2.5 py-1.5 text-xs shadow"
          style={{
            background: 'var(--ink)',
            color: 'var(--bg)',
            top: Math.max(0, activeXY.y - 64),
            left: Math.min(Math.max(0, activeXY.x - 80), width - 170),
            width: 160,
          }}
        >
          <div className="font-semibold tabular">{Math.round(active.rating)}</div>
          <div>{fmt.format(new Date(active.kickoff))}</div>
          <div>
            {labels.result[active.result]} {active.score} · {active.opponent}
          </div>
        </div>
      )}
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer muted">{labels.table}</summary>
        <div className="mt-2 max-h-64 overflow-y-auto">
          <table className="w-full text-left tabular">
            <thead className="muted">
              <tr>
                <th className="py-1 pr-3 font-medium">{labels.date}</th>
                <th className="py-1 pr-3 font-medium">{labels.opponent}</th>
                <th className="py-1 text-right font-medium">{labels.rating}</th>
              </tr>
            </thead>
            <tbody>
              {[...points].reverse().map((p) => (
                <tr key={p.kickoff + p.opponent} className="border-t" style={{ borderColor: 'var(--line)' }}>
                  <td className="py-1 pr-3">{fmt.format(new Date(p.kickoff))}</td>
                  <td className="py-1 pr-3">
                    {labels.result[p.result]} {p.score} · {p.opponent}
                  </td>
                  <td className="py-1 text-right">{Math.round(p.rating)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
