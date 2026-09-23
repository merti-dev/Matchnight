'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { dictionary, isLocale, DEFAULT_LOCALE } from '@/i18n';

export default function NotFound() {
  const params = useParams<{ locale?: string }>();
  const locale = params.locale && isLocale(params.locale) ? params.locale : DEFAULT_LOCALE;
  const t = dictionary(locale);
  return (
    <div className="card mx-auto max-w-md p-6 text-center">
      <h1 className="text-lg font-semibold">{t.notFound.title}</h1>
      <Link href={`/${locale}`} className="mt-4 inline-block rounded-lg px-4 py-2 text-sm font-medium" style={{ background: 'var(--accent-fill)', color: 'var(--accent-ink)' }}>
        {t.notFound.back}
      </Link>
    </div>
  );
}
