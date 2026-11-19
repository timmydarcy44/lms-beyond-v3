import { CFA_SPECIALIZATIONS, type CfaSpecialization } from "@/lib/cfa-applications";

export type ChallengeAnswerFormat = "text" | "audio" | "video";

export type ChallengeQuestionRow = {
  id: string;
  specialization: string;
  slug: string;
  label: string;
  prompt: string;
  starter_hint: string | null;
  sort_order: number;
  active: boolean;
  versionId: string;
  version: number;
};

export type ChallengeResponse = {
  questionId: string;
  versionId: string;
  slug: string;
  label: string;
  prompt: string;
  format: ChallengeAnswerFormat;
  text?: string;
  mediaPath?: string;
  mediaDurationSec?: number;
  updatedAt?: string;
};

export type ChallengeV2State = {
  responses: ChallengeResponse[];
  hiddenBySpecializationChange?: Record<string, ChallengeResponse[]>;
};

export type ParcoursDiploma =
  | "brevet"
  | "cap_bep"
  | "bac_general"
  | "bac_techno"
  | "bac_pro"
  | "bac_plus_1"
  | "bac_plus_2"
  | "bac_plus_3"
  | "aucun";

export type ParcoursSituation =
  | "lyceen"
  | "etudiant"
  | "emploi"
  | "recherche"
  | "reconversion";

export type ParcoursExperience =
  | "job_etudiant"
  | "stage"
  | "vente"
  | "sport"
  | "benevolat"
  | "projet"
  | "rien";

export type ParcoursState = {
  diploma?: ParcoursDiploma | "";
  diplomaYear?: string;
  school?: string;
  situation?: ParcoursSituation | "";
  experiences?: ParcoursExperience[];
  experiencesDetail?: string;
  companyName?: string;
};

export const PARCOURS_DIPLOMA_OPTIONS: { value: ParcoursDiploma; label: string }[] = [
  { value: "brevet", label: "Brevet" },
  { value: "cap_bep", label: "CAP / BEP" },
  { value: "bac_general", label: "Bac général" },
  { value: "bac_techno", label: "Bac technologique" },
  { value: "bac_pro", label: "Bac pro" },
  { value: "bac_plus_1", label: "Bac+1" },
  { value: "bac_plus_2", label: "Bac+2" },
  { value: "bac_plus_3", label: "Bac+3 et plus" },
  { value: "aucun", label: "Aucun diplôme" },
];

export const PARCOURS_SITUATION_OPTIONS: { value: ParcoursSituation; label: string }[] = [
  { value: "lyceen", label: "Lycéen·ne" },
  { value: "etudiant", label: "Étudiant·e" },
  { value: "emploi", label: "En emploi" },
  { value: "recherche", label: "En recherche" },
  { value: "reconversion", label: "En reconversion" },
];

export const PARCOURS_EXPERIENCE_OPTIONS: { value: ParcoursExperience; label: string }[] = [
  { value: "job_etudiant", label: "Job étudiant" },
  { value: "stage", label: "Stage" },
  { value: "vente", label: "Vente ou accueil client" },
  { value: "sport", label: "Sport en club" },
  { value: "benevolat", label: "Bénévolat" },
  { value: "projet", label: "Projet perso" },
  { value: "rien", label: "Rien encore, et c’est ok" },
];

/** Diplômes considérés « bac » pour le contrôle prérequis soft. */
export const DIPLOMAS_MEETING_BAC: ParcoursDiploma[] = [
  "bac_general",
  "bac_techno",
  "bac_pro",
  "bac_plus_1",
  "bac_plus_2",
  "bac_plus_3",
];

/** Toute filière catalogue peut avoir ses questions ; le loader DB tranche. */
export function specializationHasCustomQuestions(spec: string): boolean {
  return CFA_SPECIALIZATIONS.some((item) => item.value === spec);
}

/** @deprecated Préférer le loader DB (track puis `_fallback`). */
export function resolveQuestionSpecialization(spec: CfaSpecialization | string): string {
  if (specializationHasCustomQuestions(spec)) return spec;
  return "_fallback";
}

export function usefulTextLength(value: string): number {
  return value.replace(/\s+/g, " ").trim().length;
}

export function isResponseComplete(response: ChallengeResponse | undefined): boolean {
  if (!response) return false;
  if (response.format === "text") return usefulTextLength(response.text ?? "") >= 20;
  if (response.format === "audio" || response.format === "video") {
    return Boolean(response.mediaPath) && (response.mediaDurationSec ?? 0) >= 20;
  }
  return false;
}

export const TEXT_MAX_CHARS = 800;
export const AUDIO_MAX_SEC = 180;
export const VIDEO_MAX_SEC = 120;
