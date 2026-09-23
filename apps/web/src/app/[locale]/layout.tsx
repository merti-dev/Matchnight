import Link from 'next/link';
import { Suspense } from 'react';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';
import { api } from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { resolveLocale } from '@/lib/page';
import { routes } from '@/lib/routes';
import '../globals.css';

// Sayfalar istek anında üretilir (build sırasında API'ye ihtiyaç olmasın diye);
// API yanıtları yine de lib/api.ts'teki revalidate süresi kadar önbellekte kalır.
export const dynamic = 'force-dynamic';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale, t } = await resolveLocale(params);
  const meta = await api.meta().catch(() => null);

  const nav = [
    [routes.seasons(locale), t.nav.seasons],
    [routes.ranking(locale), t.nav.ranking],
    [routes.onThisDay(locale), t.nav.onThisDay],
    [routes.method(locale), t.nav.method],
  ] as const;

  return (
    <html lang={locale}>
      {/* Tarayıcı eklentileri (ör. ColorZilla) body'ye özellik ekleyip hydration uyarısı
          tetikliyor. Yalnız body'nin kendi özelliklerini susturur, içerik yine denetlenir. */}
      <body suppressHydrationWarning>
        <header className="sticky top-0 z-30 border-b backdrop-blur" style={{ borderColor: 'var(--line)', background: 'color-mix(in srgb, var(--bg) 82%, transparent)' }}>
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-1 px-4 py-3">
            <Link href={routes.home(locale)} className="flex items-baseline gap-2">
              <span className="text-lg font-bold tracking-tight">
                Match<span style={{ color: 'var(--accent)' }}>night</span>
              </span>
              <span className="muted hidden text-xs md:inline">{t.brandTagline}</span>
            </Link>
            <nav className="order-3 flex w-full gap-1 overflow-x-auto text-sm sm:order-none sm:ml-auto sm:w-auto">
              {nav.map(([href, label]) => (
                <Link key={href} href={href} className="ink-2 whitespace-nowrap rounded-md px-2 py-1 hover:bg-[var(--surface-2)] hover:text-[var(--ink)]">
                  {label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto sm:ml-0">
              <Suspense fallback={null}>
                <LocaleSwitcher current={locale} />
              </Suspense>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

        <footer className="mx-auto max-w-6xl space-y-1 px-4 pb-10 pt-6 text-xs muted">
          <p>{t.footer.independent}</p>
          <p className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              {t.footer.data}:{' '}
              <a className="underline" href="https://github.com/openfootball/champions-league">openfootball</a>
              {meta?.liveSource === 'football-data' && (
                <>
                  {' · '}
                  <a className="underline" href="https://www.football-data.org">football-data.org</a>
                </>
              )}
            </span>
            {meta?.lastSync && <span>{t.footer.updated(formatDateTime(meta.lastSync, locale))}</span>}
            <Link className="underline" href={routes.imprint(locale)}>{t.footer.legal}</Link>
            <Link className="underline" href={routes.privacy(locale)}>{t.footer.privacy}</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
