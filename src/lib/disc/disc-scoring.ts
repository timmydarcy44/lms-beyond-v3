import type { DiscLabel } from "@/lib/disc/disc-questions-types";
import { DISC_PROFILE_LABELS } from "@/lib/disc/disc-constants";

export const DISC_MIXED_PROFILE_THRESHOLD = 8;

export type DiscRawScores = Record<DiscLabel, number>;
export type DiscNormalizedScores = Record<DiscLabel, number>;

export function emptyDiscRawScores(): DiscRawScores {
  return { D: 0, I: 0, S: 0, C: 0 };
}

export function applyIpsativeAnswer(
  scores: DiscRawScores,
  most: DiscLabel,
  least: DiscLabel,
): DiscRawScores {
  return {
    ...scores,
    [most]: scores[most] + 1,
    [least]: scores[least] - 1,
  };
}

/** score_normalisé = round(((brut + N) / (2 × N)) × 100) — 50 % = neutre */
export function normalizeDiscScores(
  raw: DiscRawScores,
  questionCount: number,
): DiscNormalizedScores {
  const out = {} as DiscNormalizedScores;
  for (const label of ["D", "I", "S", "C"] as DiscLabel[]) {
    out[label] = Math.round(((raw[label] + questionCount) / (2 * questionCount)) * 100);
  }
  return out;
}

export type DiscProfileResolution = {
  dominant: DiscLabel;
  secondary: DiscLabel | null;
  isMixed: boolean;
  profileLabel: string;
  finalProfile: string;
};

function rankNormalizedScores(
  normalized: DiscNormalizedScores,
  raw?: DiscRawScores,
): Array<[DiscLabel, number]> {
  const entries = Object.entries(normalized) as Array<[DiscLabel, number]>;
  return entries.sort((a, b) => {
    if (b[1] !== a[1]) return b[1] - a[1];
    if (raw && raw[b[0]] !== raw[a[0]]) return raw[b[0]] - raw[a[0]];
    return 0;
  });
}

function pickDominantAmongTied(tied: DiscLabel[], raw: DiscRawScores): DiscLabel {
  const sorted = [...tied].sort();
  const seed =
    raw.D * 3 + raw.I * 7 + raw.S * 11 + raw.C * 13 + normalizedSeedSpread(raw);
  return sorted[Math.abs(seed) % sorted.length];
}

function normalizedSeedSpread(raw: DiscRawScores): number {
  return Object.values(raw).reduce((acc, v) => acc + Math.abs(v), 0);
}

export function resolveDiscProfile(
  normalized: DiscNormalizedScores,
  raw?: DiscRawScores,
): DiscProfileResolution {
  const ranked = rankNormalizedScores(normalized, raw);
  const topScore = ranked[0]?.[1] ?? 50;
  const tiedTop = ranked.filter(([, score]) => score === topScore).map(([label]) => label);
  const dominant =
    tiedTop.length > 1 && raw
      ? pickDominantAmongTied(tiedTop, raw)
      : (ranked[0]?.[0] ?? "S");
  const second = ranked.find(([label]) => label !== dominant);
  const gap = second ? topScore - second[1] : DISC_MIXED_PROFILE_THRESHOLD;
  const isMixed = Boolean(second && gap < DISC_MIXED_PROFILE_THRESHOLD);

  const dominantLabel = DISC_PROFILE_LABELS[dominant];
  const secondaryLabel = isMixed && second ? DISC_PROFILE_LABELS[second[0]] : null;

  const profileLabel =
    isMixed && secondaryLabel ? `${dominantLabel}-${secondaryLabel}` : dominantLabel;
  const finalProfile =
    isMixed && secondaryLabel ? `Profil ${dominantLabel}-${secondaryLabel}` : `Profil ${dominantLabel}`;

  return {
    dominant,
    secondary: isMixed && second ? second[0] : null,
    isMixed,
    profileLabel,
    finalProfile,
  };
}

export function computeDiscResult(raw: DiscRawScores, questionCount: number) {
  const normalized = normalizeDiscScores(raw, questionCount);
  const profile = resolveDiscProfile(normalized, raw);
  return { raw, normalized, ...profile };
}

/** Extrait les scores normalisés 0-100 depuis un objet scores en base (legacy ou enrichi). */
export function parseStoredDiscScores(
  stored: Record<string, unknown> | null | undefined,
): DiscNormalizedScores | null {
  if (!stored || typeof stored !== "object") return null;

  const nested = stored.normalized_scores ?? stored.normalized;
  if (nested && typeof nested === "object") {
    const parsed = readLabelScores(nested as Record<string, unknown>);
    if (parsed) return parsed;
  }

  const direct = readLabelScores(stored);
  if (!direct) return null;

  const max = Math.max(direct.D, direct.I, direct.S, direct.C);
  const min = Math.min(direct.D, direct.I, direct.S, direct.C);

  if (max <= 100 && min >= 0 && max > 25) {
    return direct;
  }

  const questionCount = max <= 20 && min >= 0 ? 20 : 30;
  return normalizeDiscScores(direct as DiscRawScores, questionCount);
}

function readLabelScores(obj: Record<string, unknown>): DiscNormalizedScores | null {
  const d = Number(obj.D);
  const i = Number(obj.I);
  const s = Number(obj.S);
  const c = Number(obj.C);
  if (![d, i, s, c].every((v) => Number.isFinite(v))) return null;
  return { D: d, I: i, S: s, C: c };
}

export const DISC_STORED_QUESTION_COUNT = 30;
