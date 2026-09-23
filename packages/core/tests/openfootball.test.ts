import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { inferGroups } from '../src/groups.js';
import { parseOpenfootball, parseScore, parseStageHeader } from '../src/openfootball.js';

const DIR = join(import.meta.dirname, 'fixtures/openfootball');
const seasons = readdirSync(DIR).map((f) => f.replace('.txt', '')).sort();

function load(season: string) {
  const text = readFileSync(join(DIR, `${season}.txt`), 'utf8');
  const result = parseOpenfootball(text, season);
  inferGroups(result.matches);
  return { text, ...result };
}

describe('skor biçimleri', () => {
  it('normal maç: skor ve ilk yarı', () => {
    expect(parseScore('2-1 (1-0)')).toEqual({
      score: { home: 2, away: 1 }, halfTime: { home: 1, away: 0 }, extraTime: false, penalties: null,
    });
  });
  it('ilk yarısı yazılmamış maç', () => {
    expect(parseScore('0-0')?.halfTime).toBeNull();
  });
  it('uzatma: skor uzatma sonrası, parantezdeki ikinci çift ilk yarı', () => {
    expect(parseScore('4-1 a.e.t. (3-1, 1-0)')).toEqual({
      score: { home: 4, away: 1 }, halfTime: { home: 1, away: 0 }, extraTime: true, penalties: null,
    });
  });
  it('penaltı: maç sonucu uzatma skoru, penaltılar ayrı', () => {
    const r = parseScore('4-3 pen. 1-1 a.e.t. (1-1, 0-1)');
    expect(r?.score).toEqual({ home: 1, away: 1 });
    expect(r?.penalties).toEqual({ home: 4, away: 3 });
    expect(r?.halfTime).toEqual({ home: 0, away: 1 });
  });
  it('ilk yarısı olmayan penaltılı maç', () => {
    const r = parseScore('8-7 pen. 0-0 a.e.t. (0-0)');
    expect(r?.penalties).toEqual({ home: 8, away: 7 });
    expect(r?.halfTime).toBeNull();
  });
});

describe('aşama başlıkları', () => {
  it.each([
    ['▪ Group A', 'GROUP', 'A'],
    ['▪ Gruppe H', 'GROUP', 'H'],
    ['▪ Group, Matchday 3', 'GROUP', null],
    ['▪ League, Matchday 8', 'LEAGUE', null],
    ['▪ Playoffs, Matchday 2', 'PLAYOFF', null],
    ['▪ Round of 16', 'R16', null],
    ['▪ Finals, Round of 16', 'R16', null],
    ['▪ Finals, Quarterfinals', 'QF', null],
    ['▪ Semifinals', 'SF', null],
    ['▪ Finals, Final', 'FINAL', null],
  ])('%s', (header, stage, group) => {
    expect(parseStageHeader(header)).toMatchObject({ stage, group });
  });
});

describe.each(seasons)('gerçek veri: %s', (season) => {
  const { text, matches, warnings } = load(season);

  it('uyarısız okunuyor', () => {
    expect(warnings).toEqual([]);
  });

  it('dosyanın beyan ettiği maç sayısı ile okunan maç sayısı eşit', () => {
    const declared = Number(/# Matches\s+(\d+)/.exec(text)?.[1]);
    expect(matches.length).toBe(declared);
  });

  it('bütün maçlar sonuçlanmış, takımların ülke kodu var', () => {
    for (const m of matches) {
      expect(m.status).toBe('finished');
      expect(m.home.country).toMatch(/^[A-Z]{3}$/);
      expect(m.away.country).toMatch(/^[A-Z]{3}$/);
    }
  });

  it('maçlar sezon aralığında (Ağustos-Ağustos) ve saatler bilinir', () => {
    const start = Number(season.slice(0, 4));
    for (const m of matches) {
      const d = new Date(m.kickoff);
      expect(d.getTime()).toBeGreaterThanOrEqual(Date.UTC(start, 6, 1));
      expect(d.getTime()).toBeLessThan(Date.UTC(start + 1, 8, 1));
      expect(m.timeKnown).toBe(true);
    }
  });

  it('grup maçlarının hepsinin harfi var, her grupta 4 takım ve 12 maç', () => {
    const group = matches.filter((m) => m.stage === 'GROUP');
    if (!group.length) return;
    const byGroup = new Map<string, Set<string>>();
    const counts = new Map<string, number>();
    for (const m of group) {
      expect(m.group).toMatch(/^[A-H]$/);
      const set = byGroup.get(m.group!) ?? new Set();
      set.add(m.home.name).add(m.away.name);
      byGroup.set(m.group!, set);
      counts.set(m.group!, (counts.get(m.group!) ?? 0) + 1);
    }
    expect(byGroup.size).toBe(8);
    for (const [, teams] of byGroup) expect(teams.size).toBe(4);
    for (const [, c] of counts) expect(c).toBe(12);
  });

  it('eleme eşleşmeleri tek maç (tarafsız) ya da iki ayak', () => {
    for (const m of matches.filter((x) => !['GROUP', 'LEAGUE'].includes(x.stage))) {
      if (m.neutral) expect(m.round).toBeNull();
      else expect([1, 2]).toContain(m.round);
    }
    const finals = matches.filter((m) => m.stage === 'FINAL');
    expect(finals).toHaveLength(1);
    expect(finals[0]!.neutral).toBe(true);
  });
});

describe('2023-24 grup çıkarımı gerçek gruplarla örtüşüyor', () => {
  const { matches } = load('2023-24');
  const groupOf = (team: string) => matches.find((m) => m.stage === 'GROUP' && (m.home.name === team || m.away.name === team))?.group;
  it.each([
    ['Galatasaray SK', 'A'], ['Manchester United FC', 'A'], ['FC København', 'A'],
    ['PSV', 'B'], ['Sevilla FC', 'B'],
    ['SSC Napoli', 'C'], ['1. FC Union Berlin', 'C'],
    ['FC Internazionale Milano', 'D'], ['Sport Lisboa e Benfica', 'D'],
    ['SS Lazio', 'E'], ['Celtic FC', 'E'],
    ['Paris Saint-Germain FC', 'F'], ['Newcastle United FC', 'F'], ['AC Milan', 'F'],
    ['RB Leipzig', 'G'], ['FK Crvena Zvezda', 'G'],
    ['FC Porto', 'H'], ['Royal Antwerp FC', 'H'],
  ])('%s -> Grup %s', (team, letter) => {
    expect(groupOf(team)).toBe(letter);
  });
});
