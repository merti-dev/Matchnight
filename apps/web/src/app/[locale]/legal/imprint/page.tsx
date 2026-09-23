import { legal } from '@/i18n/legal';
import { pageMeta, resolveLocale } from '@/lib/page';

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params) {
  const { locale } = await resolveLocale(params);
  return { ...pageMeta(locale, '/legal/imprint', legal[locale].imprintTitle), robots: { index: false } };
}

export default async function ImprintPage({ params }: Params) {
  const { locale } = await resolveLocale(params);
  const l = legal[locale];
  const name = process.env.IMPRINT_NAME;
  const address = process.env.IMPRINT_ADDRESS;
  const email = process.env.IMPRINT_EMAIL;
  return (
    <article className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">{l.imprintTitle}</h1>
      {name && address && email ? (
        <>
          <p className="muted text-sm">{l.imprintLaw}</p>
          <p className="whitespace-pre-line">{`${name}\n${address.replaceAll('\\n', '\n')}`}</p>
          <p>
            {l.contact}: <a className="underline" href={`mailto:${email}`}>{email}</a>
          </p>
        </>
      ) : (
        <p className="card p-4">{l.notConfigured}</p>
      )}
    </article>
  );
}
