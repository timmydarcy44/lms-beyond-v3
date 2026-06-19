import type { DiscLabel } from "@/lib/disc/disc-questions-types";
import {
  DISC_MIXED_PROFILE_THRESHOLD,
  parseStoredDiscScores,
  rankNormalizedScores,
  type DiscNormalizedScores,
} from "@/lib/disc/disc-scoring";
import type { IdmcAxisKey } from "@/lib/idmc/idmc-questions";
import { IDMC_AXES_LABELS } from "@/lib/idmc/idmc-questions";
import { SOFT_SKILLS } from "@/lib/soft-skills/questions";

export const DISC_ARCHETYPE_LABELS: Record<DiscLabel, string> = {
  D: "Le Chasseur",
  I: "Le Connecteur",
  S: "Le Fidélisateur",
  C: "L'Analyste",
};

/** Ordre de priorité commercial en cas d'égalité IDMC. */
export const IDMC_AXIS_COMMERCIAL_PRIORITY: IdmcAxisKey[] = [
  "A6",
  "A4",
  "A3",
  "A5",
  "A2",
  "A1",
  "A7",
  "A8",
];

export const IDMC_AXIS_EMAIL_PHRASES: Record<IdmcAxisKey, string> = {
  A1: "une vraie lucidité sur vos propres réactions",
  A2: "une méthode de travail déjà solide",
  A3: "une capacité à vous ajuster selon les situations",
  A4: "le sens de l'anticipation et de l'organisation",
  A5: "une bonne capacité à trier et structurer l'information",
  A6: "le réflexe de trouver des solutions face aux obstacles",
  A7: "le sens du suivi dans la durée",
  A8: "une capacité à évaluer objectivement votre propre travail",
};

/** Tournures email pour les 20 soft skills (ordre = priorité commerciale en cas d'égalité). */
export const SOFT_SKILL_EMAIL_PHRASES: Record<string, string> = {
  "Communication interpersonnelle": "la communication interpersonnelle",
  "Écoute active": "l'écoute active",
  Empathie: "l'empathie",
  "Gestion des conflits": "la gestion des conflits",
  Leadership: "le leadership",
  "Collaboration et travail en équipe": "le travail en équipe",
  Adaptabilité: "l'adaptabilité",
  "Gestion du stress": "la gestion du stress",
  "Intelligence émotionnelle": "l'intelligence émotionnelle",
  "Confiance en soi": "la confiance en soi",
  "Résolution des problèmes": "la résolution de problèmes",
  "Prise de décision": "la prise de décision",
  "Gestion du temps": "la gestion du temps",
  Persévérance: "la persévérance",
  "Esprit critique": "l'esprit critique",
  Créativité: "la créativité",
  Proactivité: "la proactivité",
  "Sens de l'organisation": "le sens de l'organisation",
  "Ouverture d'esprit": "l'ouverture d'esprit",
  "Sens des responsabilités": "le sens des responsabilités",
};

const POLYVALENT_ARCHETYPE =
  "un profil commercial polyvalent, qui combine plusieurs approches selon le contexte";

function readNormalizedFromDiscRow(scores: unknown): DiscNormalizedScores | null {
  if (!scores || typeof scores !== "object") return null;
  return parseStoredDiscScores(scores as Record<string, unknown>);
}

/** Archétype DISC pour l'email (seuil mixte = DISC_MIXED_PROFILE_THRESHOLD). */
export function resolveDiscArchetypeForEmail(scores: unknown): string {
  const normalized = readNormalizedFromDiscRow(scores);
  if (!normalized) return POLYVALENT_ARCHETYPE;

  const ranked = rankNormalizedScores(normalized);
  const topScore = ranked[0]?.[1] ?? 50;
  const thirdScore = ranked[2]?.[1] ?? 0;
  if (topScore - thirdScore < 10) {
    return POLYVALENT_ARCHETYPE;
  }

  const dominant = ranked[0]?.[0] ?? "S";
  const second = ranked[1];
  const gap = second ? topScore - second[1] : DISC_MIXED_PROFILE_THRESHOLD;
  const isMixed = Boolean(second && gap < DISC_MIXED_PROFILE_THRESHOLD);

  if (isMixed && second) {
    return `un profil mixte ${DISC_ARCHETYPE_LABELS[dominant]}-${DISC_ARCHETYPE_LABELS[second[0]]}`;
  }

  return DISC_ARCHETYPE_LABELS[dominant];
}

export function readIdmcAxisPercentages(scores: unknown): Record<IdmcAxisKey, number> | null {
  if (!scores || typeof scores !== "object") return null;
  const axes = (scores as Record<string, unknown>).axes;
  if (!axes || typeof axes !== "object") return null;
  const out = {} as Record<IdmcAxisKey, number>;
  for (const key of IDMC_AXIS_COMMERCIAL_PRIORITY) {
    const raw = (axes as Record<string, unknown>)[key];
    const n = Number(raw);
    if (Number.isFinite(n)) out[key] = n;
  }
  return Object.keys(out).length === 8 ? out : null;
}

export function resolveDominantIdmcAxis(
  axisPercentages: Record<IdmcAxisKey, number>,
): IdmcAxisKey {
  let bestKey: IdmcAxisKey = "A6";
  let bestScore = -1;

  for (const key of IDMC_AXIS_COMMERCIAL_PRIORITY) {
    const score = axisPercentages[key] ?? 0;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
      continue;
    }
    if (score === bestScore) {
      const currentPriority = IDMC_AXIS_COMMERCIAL_PRIORITY.indexOf(bestKey);
      const candidatePriority = IDMC_AXIS_COMMERCIAL_PRIORITY.indexOf(key);
      if (candidatePriority < currentPriority) {
        bestKey = key;
      }
    }
  }

  return bestKey;
}

export function resolveIdmcGlobalLevel(scores: unknown, levelColumn: unknown): string {
  if (typeof levelColumn === "string" && levelColumn.trim()) {
    return levelColumn.trim();
  }
  if (scores && typeof scores === "object") {
    const level = (scores as Record<string, unknown>).level;
    if (typeof level === "string" && level.trim()) return level.trim();
  }
  return "Maîtrise en développement";
}

export function resolveTopSoftSkillsForEmail(
  scores: unknown,
  count = 2,
): Array<{ title: string; emailPhrase: string; score: number }> {
  if (!scores || typeof scores !== "object") return [];

  const entries = Object.entries(scores as Record<string, unknown>)
    .map(([title, raw]) => ({
      title,
      score: Number(raw),
      emailPhrase: SOFT_SKILL_EMAIL_PHRASES[title] ?? title.toLowerCase(),
      commercialOrder: SOFT_SKILLS.findIndex((s) => s.titre === title),
    }))
    .filter((row) => Number.isFinite(row.score));

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const orderA = a.commercialOrder >= 0 ? a.commercialOrder : 999;
    const orderB = b.commercialOrder >= 0 ? b.commercialOrder : 999;
    return orderA - orderB;
  });

  return entries.slice(0, count).map(({ title, emailPhrase, score }) => ({
    title,
    emailPhrase,
    score,
  }));
}

export function formatIdmcAxisLabel(axis: IdmcAxisKey): string {
  return IDMC_AXES_LABELS[axis];
}
