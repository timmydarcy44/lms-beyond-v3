/**
 * Simulation de cohérence DISC — 500 passations aléatoires.
 * Usage: npx tsx scripts/disc-coherence-simulation.ts
 */
import { DISC_QUESTION_COUNT } from "../src/lib/disc/disc-questions";
import {
  applyIpsativeAnswer,
  computeDiscResult,
  emptyDiscRawScores,
  type DiscLabel,
} from "../src/lib/disc/disc-scoring";

const LABELS: DiscLabel[] = ["D", "I", "S", "C"];
const RUNS = 500;
const MAX_DOMINANT_SHARE = 0.4;

function shuffleLabels(items: DiscLabel[]): DiscLabel[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function randomMostAndLeast(): { most: DiscLabel; least: DiscLabel } {
  const shuffled = shuffleLabels(LABELS);
  return { most: shuffled[0], least: shuffled[1] };
}

function simulateOnce() {
  let raw = emptyDiscRawScores();
  for (let q = 0; q < DISC_QUESTION_COUNT; q += 1) {
    const { most, least } = randomMostAndLeast();
    raw = applyIpsativeAnswer(raw, most, least);
  }
  return computeDiscResult(raw, DISC_QUESTION_COUNT);
}

const dominantCounts: Record<DiscLabel, number> = { D: 0, I: 0, S: 0, C: 0 };
const mixedCount = { n: 0 };
const meanNorm = { D: 0, I: 0, S: 0, C: 0 };

for (let i = 0; i < RUNS; i += 1) {
  const result = simulateOnce();
  dominantCounts[result.dominant] += 1;
  if (result.isMixed) mixedCount.n += 1;
  for (const label of LABELS) {
    meanNorm[label] += result.normalized[label];
  }
}

console.log(`\n=== Simulation DISC — ${RUNS} passations aléatoires ===\n`);
console.log("Distribution des profils dominants :");
for (const label of LABELS) {
  const pct = ((dominantCounts[label] / RUNS) * 100).toFixed(1);
  const flag = dominantCounts[label] / RUNS > MAX_DOMINANT_SHARE ? " ⚠️  BIAIS" : " ✓";
  console.log(`  ${label}: ${dominantCounts[label]} (${pct}%)${flag}`);
}
console.log(`\nProfils mixtes (< 8 pts d'écart): ${mixedCount.n} (${((mixedCount.n / RUNS) * 100).toFixed(1)}%)`);
console.log("\nScores normalisés moyens (attendu ~50 % chacun) :");
for (const label of LABELS) {
  console.log(`  ${label}: ${(meanNorm[label] / RUNS).toFixed(2)} %`);
}

const maxShare = Math.max(...LABELS.map((l) => dominantCounts[l] / RUNS));
if (maxShare > MAX_DOMINANT_SHARE) {
  console.error(
    `\nÉCHEC: une dimension dépasse ${MAX_DOMINANT_SHARE * 100}% (${(maxShare * 100).toFixed(1)}%)`,
  );
  process.exit(1);
}

console.log("\nOK — distribution équilibrée entre D/I/S/C.\n");
process.exit(0);
