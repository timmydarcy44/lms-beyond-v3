/** Types partagés client/serveur pour les Défis EDGE. */

export type ChallengeFormatId = "story" | "situation" | "proof" | "video" | "ai" | "quickchallenge";

export type ChallengeChatMessage = {
  role: "user" | "assistant";
  content: string;
};

/** Débrief structuré renvoyé en fin de défi. */
export type ChallengeDebrief = {
  strengths: string[];
  improvements: string[];
  /** Niveau estimé : Débutant | Intermédiaire | Confirmé | Expert. */
  levelEstimated: string;
  /** Niveau de confiance de l'analyse (0-100). */
  confidence: number;
  nextAction: string;
  skillValidated: boolean;
  /** Résumé exploitable comme preuve de compétence. */
  summary: string;
};

export type ChallengeBadgeState = {
  key: string;
  skill: string;
  progress: number;
  status: "locked" | "in_progress" | "earned";
};

/** Réponse de l'action `finish`. */
export type ChallengeFinishResult = {
  runId: string;
  debrief: ChallengeDebrief;
  xpAwarded: number;
  totalXp: number;
  streak: number;
  badge: ChallengeBadgeState;
};

export type ChallengeContext = {
  skillName: string;
  objective: string;
  levelCurrent: string;
  levelExpected: string;
  format: ChallengeFormatId;
};

export function normalizeSkillSlug(skill: string): string {
  return skill
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function badgeKeyForSkill(skill: string): string {
  return `edge-skill-${normalizeSkillSlug(skill)}`;
}
