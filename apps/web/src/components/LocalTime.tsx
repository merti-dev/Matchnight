'use client';

import { useEffect, useState } from 'react';

/**
 * Sunucu, maç saatini Berlin saatiyle çizer (UEFA saatleri CET/CEST).
 * Tarayıcı açılınca ziyaretçinin kendi saat dilimine geçer.
 */
export function LocalTime({ iso, locale, known = true }: { iso: string; locale: string; known?: boolean }) {
  const format = (timeZone?: string) =>
    new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', ...(timeZone ? { timeZone } : {}) }).format(new Date(iso));
  const [text, setText] = useState(() => format('Europe/Berlin'));
  useEffect(() => setText(format()), [iso, locale]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!known) return null;
  return (
    <time dateTime={iso} suppressHydrationWarning className="tabular">
      {text}
    </time>
  );
}
