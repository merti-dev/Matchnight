import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_LOCALE, LOCALES, isLocale } from './i18n/config';

/** Accept-Language başlığından desteklenen en uygun dili seçer. */
function negotiate(header: string | null): string {
  if (!header) return DEFAULT_LOCALE;
  const ranked = header
    .split(',')
    .map((part) => {
      const [tag, q] = part.trim().split(';q=');
      return { lang: tag!.slice(0, 2).toLowerCase(), q: q ? Number(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  return ranked.find((r) => (LOCALES as readonly string[]).includes(r.lang))?.lang ?? DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const first = request.nextUrl.pathname.split('/')[1] ?? '';
  if (isLocale(first)) return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = `/${negotiate(request.headers.get('accept-language'))}${request.nextUrl.pathname === '/' ? '' : request.nextUrl.pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!_next|favicon|icon|robots.txt|sitemap.xml).*)'],
};
