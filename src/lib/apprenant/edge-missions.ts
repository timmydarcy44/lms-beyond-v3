/**
 * Missions EDGE — terminologie produit et mécanismes pédagogiques.
 */

import type { MissionFormatId } from "@/lib/apprenant/edge-mission-types";

export const EDGE_MISSION_LABEL = "Mission EDGE";

export const EDGE_MISSION_TERMS = {
  mission: "Mission EDGE",
  coach: "Coach EDGE",
  session: "Session interactive",
  validation: "Validation EDGE",
} as const;

export type MissionMechanic = {
  id: MissionFormatId;
  emoji: string;
  label: string;
  meta?: string;
};

/** Mécanismes pédagogiques (usage interne — l'utilisateur voit une Mission, pas un « format »). */
export const MISSION_MECHANICS: MissionMechanic[] = [
  { id: "situation", emoji: "💬", label: "Mise en situation professionnelle", meta: "10 min" },
  { id: "story", emoji: "🎤", label: "Raconter une expérience vécue", meta: "5 min" },
  { id: "ai", emoji: "🧠", label: "Échange guidé avec le coach", meta: "10 min" },
  { id: "quickchallenge", emoji: "🎯", label: "Mission express", meta: "10 min" },
  { id: "proof", emoji: "📄", label: "Déposer une preuve" },
];

export function pickMissionMechanic(skill: string): MissionMechanic {
  let hash = 0;
  for (let i = 0; i < skill.length; i += 1) hash = (hash + skill.charCodeAt(i)) % MISSION_MECHANICS.length;
  return MISSION_MECHANICS[hash];
}

export const MISSION_DEBRIEF_SECTIONS = [
  "Vos points forts",
  "Vos axes d'amélioration",
  "Ce que j'ai observé",
  "Pourquoi je pense cela",
  "Votre niveau estimé",
  "Ce qu'il faudra travailler ensuite",
  "Mission recommandée",
] as const;
