/** Demande de parcours personnalisé EDGE — approche concierge */

/** @deprecated Remplacé par EDGE_FIRST_STEPS_KEY */
export const EDGE_DASHBOARD_ONBOARDING_KEY = "edge_gps_onboarding_v1_seen";

export const EDGE_FIRST_STEPS_KEY = "edge_first_steps_v2";

export type EdgeFirstStepsPersisted = {
  completed: boolean;
  completedAt?: string;
  objective?: string;
  selectedPriority?: string;
};

export function shouldAutoStartFirstSteps(): boolean {
  const state = readFirstStepsState();
  return !state?.completed;
}

export function readFirstStepsState(): EdgeFirstStepsPersisted | null {
  try {
    const raw = localStorage.getItem(EDGE_FIRST_STEPS_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EdgeFirstStepsPersisted;
  } catch {
    return null;
  }
}

export function writeFirstStepsState(state: EdgeFirstStepsPersisted) {
  try {
    localStorage.setItem(EDGE_FIRST_STEPS_KEY, JSON.stringify(state));
    localStorage.setItem(EDGE_DASHBOARD_ONBOARDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export type PersonalizedPathRequestStatus =
  | "pending"
  | "reviewed"
  | "proposal_sent"
  | "accepted"
  | "declined";

export type CurrentSituationOption =
  | "etudiant"
  | "alternant"
  | "salarie"
  | "demandeur_emploi"
  | "reconversion"
  | "freelance"
  | "autre";

export type DeadlineOption = "rapidement" | "1_3_mois" | "3_6_mois" | "plus_tard";

export type SupportPreferenceOption = "autonomie" | "guide" | "accompagne";

export type PersonalizedPathRequestPayload = {
  objective: string;
  currentStatus: CurrentSituationOption;
  deadline: DeadlineOption;
  supportPreference: SupportPreferenceOption;
  message?: string;
  prioritySkills?: string[];
};

export type PersonalizedPathRequestRecord = PersonalizedPathRequestPayload & {
  id: string;
  userId: string;
  status: PersonalizedPathRequestStatus;
  createdAt: string;
};

export const CURRENT_SITUATION_OPTIONS: Array<{ value: CurrentSituationOption; label: string }> = [
  { value: "etudiant", label: "Étudiant" },
  { value: "alternant", label: "Alternant" },
  { value: "salarie", label: "Salarié" },
  { value: "demandeur_emploi", label: "Demandeur d'emploi" },
  { value: "reconversion", label: "Reconversion" },
  { value: "freelance", label: "Freelance" },
  { value: "autre", label: "Autre" },
];

export const DEADLINE_OPTIONS: Array<{ value: DeadlineOption; label: string }> = [
  { value: "rapidement", label: "Rapidement" },
  { value: "1_3_mois", label: "1 à 3 mois" },
  { value: "3_6_mois", label: "3 à 6 mois" },
  { value: "plus_tard", label: "Plus tard" },
];

export const SUPPORT_PREFERENCE_OPTIONS: Array<{ value: SupportPreferenceOption; label: string }> = [
  { value: "autonomie", label: "Autonomie" },
  { value: "guide", label: "Guidé" },
  { value: "accompagne", label: "Accompagné" },
];

export const PARCOURS_CONCIERGE_INTRO =
  "EDGE identifie automatiquement vos écarts de compétences. Nos experts peuvent ensuite construire un parcours personnalisé pour vous aider à progresser de manière ciblée.";
