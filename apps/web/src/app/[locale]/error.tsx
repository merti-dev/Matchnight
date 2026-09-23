'use client';

import { useParams } from 'next/navigation';
import { dictionary, isLocale, DEFAULT_LOCALE } from '@/i18n';

/** API'ye ulaşılamadığında (ör. api konteyneri yeniden başlarken) gösterilir. */
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  const params = useParams<{ locale?: string }>();
  const t = dictionary(params.locale && isLocale(params.locale) ? params.locale : DEFAULT_LOCALE);
  return (
    <div className="card mx-auto max-w-md p-6 text-center">
      <p>{t.apiDown}</p>
      <button type="button" onClick={reset} className="mt-4 rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--accent-fill)', color: 'var(--accent-ink)' }}>
        ↻
      </button>
    </div>
  );
}
