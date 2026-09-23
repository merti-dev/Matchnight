'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { LOCALES, type Locale } from '@/i18n/config';

/** Aynı sayfanın diğer dillerdeki karşılığına link verir. */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const rest = pathname.split('/').slice(2).join('/');
  return (
    <nav aria-label="Language" className="flex gap-0.5 text-xs">
      {LOCALES.map((l) => (
        <Link
          key={l}
          href={`/${l}${rest ? `/${rest}` : ''}${search ? `?${search}` : ''}`}
          hrefLang={l}
          aria-current={l === current ? 'true' : undefined}
          className={`rounded px-1.5 py-1 uppercase ${l === current ? 'font-semibold' : 'muted hover:text-[var(--ink)]'}`}
        >
          {l}
        </Link>
      ))}
    </nav>
  );
}
