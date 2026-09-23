import { legal } from '@/i18n/legal';
import { pageMeta, resolveLocale } from '@/lib/page';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await resolveLocale(params);
  return { ...pageMeta(locale, '/legal/privacy', legal[locale].privacyTitle), robots: { index: false } };
}

export default async function PrivacyPage({ params }: Params) {
  const { locale } = await resolveLocale(params);
  const l = legal[locale];
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{l.privacyTitle}</h1>
      {l.privacy.map((p) => <p key={p} className="ink-2">{p}</p>)}
    </article>
  );
}
