/**
 * UEFA maç saatleri Orta Avrupa saatiyle (CET/CEST) yazılır. Yaz saatini doğru
 * hesaba katmak için ofset Intl ile o günün kendisi için bulunuyor.
 */
const fmt = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Berlin',
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function berlinOffsetMinutes(utcMs: number): number {
  const parts = Object.fromEntries(fmt.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
  );
  return Math.round((asUtc - utcMs) / 60000);
}

/** Berlin yerel saatini UTC ISO string'e çevirir. */
export function berlinToUtcIso(year: number, month: number, day: number, hour: number, minute: number): string {
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  // İlk tahmin ofseti, sonra düzeltilmiş anın ofseti (DST sınırında iki adım gerekir)
  const first = naive - berlinOffsetMinutes(naive) * 60000;
  const exact = naive - berlinOffsetMinutes(first) * 60000;
  return new Date(exact).toISOString();
}

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' });

/** UTC anın Berlin'deki takvim günü: "YYYY-MM-DD". */
export function berlinDate(iso: string | Date): string {
  return dayFmt.format(typeof iso === 'string' ? new Date(iso) : iso);
}
