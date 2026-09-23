/**
 * Elo parametrelerini seçer ve modelin gerçekten işe yarayıp yaramadığını ölçer.
 *
 *   Isınma:  2011-12, 2012-13   (puanlar oturur, değerlendirmeye girmez)
 *   Eğitim:  2013-14 … 2022-23 (parametreler burada seçilir)
 *   Test:    2023-24 … 2025-26 (model bu sezonları hiç görmeden değerlendirilir)
 *
 *   npx tsx scripts/backtest.ts
 */
import { join } from 'node:path';
import { DEFAULT_PARAMS, evaluate, outcomeOf, runElo, type EloParams, type Outcome, type Probabilities } from '../src/elo.js';
import { normalize } from '../src/normalize.js';
import { loadArchive } from '../src/archive.js';

const { matches: raw } = loadArchive(process.env.MATCHNIGHT_DATA_DIR ? join(process.env.MATCHNIGHT_DATA_DIR, 'archive') : join(import.meta.dirname, '../../../data/archive'));
const { matches } = normalize(raw);
const finished = matches.filter((m) => m.status === 'finished');

const WARMUP = new Set(['2011-12', '2012-13']);
const TEST = new Set(['2023-24', '2024-25', '2025-26']);
const inTrain = (s: string) => !WARMUP.has(s) && !TEST.has(s);

function score(params: EloParams, pick: (season: string) => boolean) {
  const { perMatch } = runElo(finished, params);
  const pairs: Array<{ prob: Probabilities; outcome: Outcome }> = [];
  for (const m of finished) {
    if (!pick(m.season)) continue;
    pairs.push({ prob: perMatch.get(m.id)!.prob, outcome: outcomeOf(m)! });
  }
  return evaluate(pairs);
}

const grid: EloParams[] = [];
for (const k of [40, 50, 60, 70])
  for (const homeAdvantage of [0, 25, 50, 75])
    for (const newcomer of [1250, 1300, 1350, 1400, 1450])
      for (const seasonRegression of [0.1, 0.2, 0.33])
        for (const drawBase of [0.24, 0.27, 0.3])
          for (const drawScale of [300, 500, 800])
            grid.push({ k, homeAdvantage, newcomer, seasonRegression, drawBase, drawScale });

console.log(`${finished.length} maç · ${grid.length} parametre kombinasyonu deneniyor (sadece eğitim sezonları)…`);
const ranked = grid
  .map((p) => ({ p, e: score(p, inTrain) }))
  .sort((a, b) => a.e.logLoss - b.e.logLoss);

console.log('\nEğitimde en iyi 5 (log loss ↓):');
for (const { p, e } of ranked.slice(0, 5)) {
  console.log(
    `  K=${p.k} ev=${p.homeAdvantage} yeni=${p.newcomer} geri çekme=${p.seasonRegression} beraberlik=${p.drawBase}/${p.drawScale}` +
      `  →  logloss ${e.logLoss.toFixed(4)} · brier ${e.brier.toFixed(4)} · isabet %${(e.accuracy * 100).toFixed(1)}`,
  );
}

const best = ranked[0]!.p;

// Karşılaştırma için basit yöntemler: hepsine eşit olasılık ve eğitimdeki sonuç frekansları
const trainOutcomes = finished.filter((m) => inTrain(m.season)).map((m) => outcomeOf(m)!);
const freq = (o: Outcome) => trainOutcomes.filter((x) => x === o).length / trainOutcomes.length;
const baseRates: Probabilities = { home: freq('home'), draw: freq('draw'), away: freq('away') };
const testMatches = finished.filter((m) => TEST.has(m.season));
const constant = (prob: Probabilities) => evaluate(testMatches.map((m) => ({ prob, outcome: outcomeOf(m)! })));

const rows = [
  ['Eşit olasılık (1/3)', constant({ home: 1 / 3, draw: 1 / 3, away: 1 / 3 })],
  [`Geçmiş frekans (ev %${(baseRates.home * 100).toFixed(0)} / ber. %${(baseRates.draw * 100).toFixed(0)} / dep. %${(baseRates.away * 100).toFixed(0)})`, constant(baseRates)],
  ['Elo — seçilen parametreler', score(best, (s) => TEST.has(s))],
  ['Elo — koddaki DEFAULT_PARAMS', score(DEFAULT_PARAMS, (s) => TEST.has(s))],
] as const;

console.log(`\nTEST (2023-24 … 2025-26, ${testMatches.length} maç, model bu sezonları görmedi):`);
for (const [label, e] of rows) {
  console.log(`  ${label.padEnd(58)} logloss ${e.logLoss.toFixed(4)} · brier ${e.brier.toFixed(4)} · isabet %${(e.accuracy * 100).toFixed(1)}`);
}
console.log('\nSeçilen parametreler:', JSON.stringify(best));
