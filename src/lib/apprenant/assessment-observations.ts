import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import type { AxisKey } from "@/components/idmc/IdmcRadarChart";
import { formatDiscProfileSentence } from "@/lib/disc/disc-profile-label";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";

const DISC_OBS: Record<keyof DiscScores, string> = {
  D: "Vous privilégiez l'action, les décisions rapides et les objectifs clairs.",
  I: "Vous misez sur la communication, l'enthousiasme et la mobilisation des autres.",
  S: "Vous recherchez la stabilité, l'écoute et un rythme de travail régulier.",
  C: "Vous valorisez la rigueur, la qualité et le respect des procédures.",
};

const IDMC_AXIS_HINTS: Partial<Record<AxisKey, string>> = {
  A1: "connaissance de soi",
  A2: "méthodes d'apprentissage",
  A4: "organisation",
  A6: "gestion des difficultés",
};

export function buildDiscObservation(scores: DiscScores): string {
  const { dominant, secondary, isMixed } = resolveDiscProfile(scores);
  const base = DISC_OBS[dominant];
  if (!isMixed || !secondary) {
    return `${formatDiscProfileSentence(scores)} ${base}`;
  }
  return `${formatDiscProfileSentence(scores)} ${base} ${DISC_OBS[secondary]}`;
}

export function buildIdmcObservation(axes: Record<AxisKey, number>): string {
  const ranked = (Object.entries(axes) as Array<[AxisKey, number]>).sort(
    (a, b) => b[1] - a[1],
  );
  const top = ranked[0];
  const low = ranked[ranked.length - 1];
  if (!top) {
    return "Votre profil IDMC met en avant vos leviers motivationnels et vos stratégies d'apprentissage.";
  }
  const topHint = IDMC_AXIS_HINTS[top[0]] ?? "cette dimension";
  const lowHint = low ? IDMC_AXIS_HINTS[low[0]] ?? "certains axes" : "d'autres axes";
  return `Votre point fort IDMC est la ${topHint} (${top[1]} %). À renforcer : ${lowHint} (${low?.[1] ?? 0} %). Ces scores guident vos priorités de progression EDGE.`;
}

export function buildSoftSkillsObservation(
  items: Array<{ skill: string; score: number }>,
  firstName?: string,
): string {
  if (!items.length) return "";
  const sorted = [...items].sort((a, b) => b.score - a.score);
  const top = sorted.slice(0, 3).map((i) => i.skill);
  const subject = firstName ? `${firstName}` : "Vous";
  return `${subject} ressort particulièrement sur ${top.join(", ")}. Ces soft skills complètent votre profil comportemental et votre bilan IDMC pour le matching carrière.`;
}
