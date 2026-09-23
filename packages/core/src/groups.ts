import type { RawMatch } from './types.js';

/**
 * Bazı sezon dosyalarında (2023-24) grup maçları "Group, Matchday N" başlığı
 * altında, grup harfi olmadan yazılmış. Grup aşamasında her takım yalnızca kendi
 * grubundakilerle oynadığı için "birbiriyle oynayanlar" kümeleri grupları verir.
 * Harfi ise her gruptan bilinen bir takımla eşliyoruz.
 */
const ANCHORS: Record<string, Record<string, string>> = {
  '2023-24': {
    'FC Bayern München': 'A',
    'Arsenal FC': 'B',
    'Real Madrid CF': 'C',
    'Real Sociedad de Fútbol': 'D',
    'Club Atlético de Madrid': 'E',
    'Borussia Dortmund': 'F',
    'Manchester City FC': 'G',
    'FC Barcelona': 'H',
  },
};

export function inferGroups(matches: RawMatch[]): RawMatch[] {
  const groupMatches = matches.filter((m) => m.stage === 'GROUP' && !m.group);
  if (!groupMatches.length) return matches;

  // Birleşim-bul ile bağlı bileşenler
  const parent = new Map<string, string>();
  const find = (x: string): string => {
    const p = parent.get(x) ?? x;
    if (p === x) return x;
    const root = find(p);
    parent.set(x, root);
    return root;
  };
  for (const m of groupMatches) {
    const a = find(m.home.name);
    const b = find(m.away.name);
    parent.set(a, find(a));
    if (a !== b) parent.set(a, b);
  }

  const season = groupMatches[0]!.season;
  const anchors = ANCHORS[season] ?? {};
  const letterOfRoot = new Map<string, string>();
  for (const [team, letter] of Object.entries(anchors)) letterOfRoot.set(find(team), letter);

  // Çapası olmayan küme kalırsa sıradaki boş harf verilir (uyarı niteliğinde)
  const used = new Set(letterOfRoot.values());
  const spare = 'ABCDEFGH'.split('').filter((l) => !used.has(l));
  for (const m of groupMatches) {
    const root = find(m.home.name);
    if (!letterOfRoot.has(root)) letterOfRoot.set(root, spare.shift() ?? '?');
    m.group = letterOfRoot.get(root)!;
  }
  return matches;
}
