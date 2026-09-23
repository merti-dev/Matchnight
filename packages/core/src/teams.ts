import type { Team } from './types.js';

/**
 * Aynı kulüp kaynaklarda ve sezonlarda farklı adlarla geçiyor ("Bayern München",
 * "FC Bayern München"). Elo'nun sezonlar arasında kopmaması için hepsi tek
 * kimliğe bağlanıyor. Anahtar: normalize edilmiş kaynak adı. Değer: kulüp kimliği.
 *
 * Yeni bir ad çıktığında (worker log'unda "eşleşmeyen takım" uyarısı) buraya eklenir.
 */
const ALIASES: Record<string, string> = {
  'rb salzburg': 'salzburg',
  'fc red bull salzburg': 'salzburg',
  'qarabag fk': 'qarabag',
  'qarabag agdam fk': 'qarabag',
  'dinamo zagreb': 'dinamo-zagreb',
  'gnk dinamo zagreb': 'dinamo-zagreb',
  'slavia praha': 'slavia-praha',
  'sk slavia praha': 'slavia-praha',
  'manchester city': 'manchester-city',
  'manchester city fc': 'manchester-city',
  'manchester united': 'manchester-united',
  'manchester united fc': 'manchester-united',
  'tottenham hotspur': 'tottenham',
  'tottenham hotspur fc': 'tottenham',
  'atletico madrid': 'atletico-madrid',
  'club atletico de madrid': 'atletico-madrid',
  'real madrid': 'real-madrid',
  'real madrid cf': 'real-madrid',
  'real sociedad': 'real-sociedad',
  'real sociedad de futbol': 'real-sociedad',
  'olympique marseille': 'marseille',
  'olympique de marseille': 'marseille',
  'paris saint-germain': 'psg',
  'paris saint-germain fc': 'psg',
  'bayer leverkusen': 'leverkusen',
  'bayer 04 leverkusen': 'leverkusen',
  'bayern munchen': 'bayern',
  'fc bayern munchen': 'bayern',
  'olympiakos piraeus': 'olympiakos',
  'pae olympiakos sfp': 'olympiakos',
  'atalanta': 'atalanta',
  'atalanta bc': 'atalanta',
  'inter': 'inter',
  'fc internazionale milano': 'inter',
  'juventus': 'juventus',
  'juventus fc': 'juventus',
  'lazio roma': 'lazio',
  'ss lazio': 'lazio',
  'psv': 'psv',
  'psv eindhoven': 'psv',
  'feyenoord': 'feyenoord',
  'feyenoord rotterdam': 'feyenoord',
  'sl benfica': 'benfica',
  'sport lisboa e benfica': 'benfica',
  'sporting braga': 'braga',
  'sporting clube de braga': 'braga',
  'sporting cp': 'sporting',
  'sporting clube de portugal': 'sporting',
  'crvena zvezda': 'crvena-zvezda',
  'fk crvena zvezda': 'crvena-zvezda',
  'galatasaray': 'galatasaray',
  'galatasaray sk': 'galatasaray',
  'shakhtar donetsk': 'shakhtar',
  'fk shakhtar donetsk': 'shakhtar',
  'as monaco': 'monaco',
  'as monaco fc': 'monaco',
};

/** Ekranda gösterilecek kısa ad. Tabloda olmayanlar için soneki atılmış kaynak adı. */
const DISPLAY: Record<string, string> = {
  salzburg: 'RB Salzburg',
  qarabag: 'Qarabağ',
  'dinamo-zagreb': 'Dinamo Zagreb',
  'slavia-praha': 'Slavia Praha',
  'manchester-city': 'Manchester City',
  'manchester-united': 'Manchester United',
  tottenham: 'Tottenham Hotspur',
  'atletico-madrid': 'Atlético Madrid',
  'real-madrid': 'Real Madrid',
  'real-sociedad': 'Real Sociedad',
  marseille: 'Marseille',
  psg: 'Paris Saint-Germain',
  leverkusen: 'Bayer Leverkusen',
  bayern: 'Bayern München',
  olympiakos: 'Olympiakos',
  atalanta: 'Atalanta',
  inter: 'Inter',
  juventus: 'Juventus',
  lazio: 'Lazio',
  psv: 'PSV Eindhoven',
  feyenoord: 'Feyenoord',
  benfica: 'Benfica',
  braga: 'Braga',
  sporting: 'Sporting CP',
  'crvena-zvezda': 'Crvena Zvezda',
  galatasaray: 'Galatasaray',
  shakhtar: 'Shakhtar Donetsk',
  monaco: 'AS Monaco',
  'sport-lisboa-e-benfica': 'Benfica',
};

/** Karşılaştırma anahtarı: küçük harf, aksansız, tek boşluk. */
export function nameKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ı/g, 'i')
    .replace(/ø/g, 'o')
    .replace(/ł/g, 'l')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function slugify(name: string): string {
  return nameKey(name)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Tabloda olmayan kulüpler için okunur ad: "Arsenal FC" -> "Arsenal", "SSC Napoli" -> "Napoli". */
function cleanName(name: string): string {
  return name
    .replace(/^(FC|AFC|SSC|FK|PFC|NK|GNK|BSC)\s+/, '')
    .replace(/\s+(FC|CF|SK|KV|FK|HSC)$/, '')
    .trim();
}

export interface ResolvedTeam {
  id: string;
  name: string;
  /** Tabloda bulunamadı — yeni kulüp ya da eksik alias. */
  unknown: boolean;
}

export function resolveTeam(sourceName: string): ResolvedTeam {
  const key = nameKey(sourceName);
  const aliased = ALIASES[key];
  const id = aliased ?? slugify(cleanName(sourceName));
  return { id, name: DISPLAY[id] ?? cleanName(sourceName), unknown: !aliased };
}

export function toTeam(sourceName: string, country: string | null): Team {
  const resolved = resolveTeam(sourceName);
  return { id: resolved.id, name: resolved.name, country: country ?? '' };
}
