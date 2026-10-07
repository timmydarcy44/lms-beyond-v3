export const CFA_SPECIALIZATIONS = [
  { value: "ai_business", label: "AI Business" },
  { value: "sport_business", label: "Sport Business" },
  { value: "real_estate", label: "Real Estate" },
] as const;

export type CfaSpecialization = (typeof CFA_SPECIALIZATIONS)[number]["value"];

export const CFA_APPLICATION_STATUSES = [
  "profile",
  "challenge",
  "dossier",
  "interview",
  "review",
  "admitted",
  "rejected",
] as const;

export type CfaApplicationStatus = (typeof CFA_APPLICATION_STATUSES)[number];

export const CFA_STATUS_LABELS: Record<CfaApplicationStatus, string> = {
  profile: "Application",
  challenge: "Challenge",
  dossier: "Dossier",
  interview: "Entretien",
  review: "Review",
  admitted: "Admitted",
  rejected: "Non retenu",
};

export const CFA_CHALLENGE_QUESTIONS = [
  {
    id: "first_clients",
    eyebrow: "Curiosité business",
    question:
      "Une entreprise fictive lance un nouveau produit demain. Comment trouverais-tu ses 10 premiers clients ?",
  },
  {
    id: "improve_offer",
    eyebrow: "Raisonnement",
    question:
      "Un produit plaît beaucoup mais se vend peu. Quelles seraient les trois premières choses que tu chercherais à comprendre ?",
  },
  {
    id: "ai_use",
    eyebrow: "Projection",
    question:
      "Si tu avais une IA comme collègue commercial pendant une journée, que lui demanderais-tu de faire ?",
  },
  {
    id: "motivation",
    eyebrow: "Motivation",
    question:
      "Quel projet aimerais-tu être capable de construire dans deux ans grâce à Byound ?",
  },
] as const;

export type CfaApplication = {
  id: string;
  resume_token?: string;
  status: CfaApplicationStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  education_level: string | null;
  specialization: CfaSpecialization;
  challenge_answers: Record<string, string>;
  challenge_completed_at: string | null;
  school_background: string | null;
  experiences: string | null;
  cv_path: string | null;
  cv_url?: string | null;
  motivation_text: string | null;
  motivation_media_url: string | null;
  motivation_media_signed_url?: string | null;
  alternance_status: "company_found" | "searching" | null;
  interview_notes?: string | null;
  interview_at?: string | null;
  admission_decision_notes?: string | null;
  admitted_at?: string | null;
  financing_path: "alternance" | "byound_start" | null;
  career_center_activated_at: string | null;
  created_at: string;
  updated_at: string;
};

export function getCfaSpecializationLabel(value: string): string {
  return CFA_SPECIALIZATIONS.find((item) => item.value === value)?.label ?? value;
}
