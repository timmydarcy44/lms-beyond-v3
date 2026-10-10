export const CFA_SPECIALIZATIONS = [
  { value: "ai_business", label: "AI Business", group: "NTC · Business & Sales" },
  { value: "sport_business", label: "Business Sport", group: "NTC · Business & Sales" },
  { value: "real_estate", label: "Real Estate", group: "NTC · Business & Sales" },
  { value: "retail_experience", label: "Retail Experience", group: "MEM · Retail & Luxury" },
  { value: "merchandising", label: "Merchandising", group: "MEM · Retail & Luxury" },
  { value: "luxury_premium", label: "Luxury & Premium", group: "MEM · Retail & Luxury" },
  { value: "ai_management", label: "AI Management", group: "REM · Management" },
  { value: "business_performance", label: "Business Performance", group: "REM · Management" },
  { value: "transition_innovation", label: "Transition & Innovation", group: "REM · Management" },
  { value: "growth_acquisition", label: "Growth & Acquisition", group: "RDC · Business Development" },
  { value: "entrepreneurship", label: "Entrepreneurship", group: "RDC · Business Development" },
  { value: "international_business", label: "International Business", group: "RDC · Business Development" },
  { value: "strategic_partnerships", label: "Strategic Partnerships", group: "RDC · Business Development" },
] as const;

export type CfaSpecialization = (typeof CFA_SPECIALIZATIONS)[number]["value"];

export type CfaPrivateFile = {
  path: string;
  original_name?: string;
  mime_type?: string;
  size_bytes?: number;
  uploaded_at?: string;
  signed_url?: string | null;
};

export const CFA_APPLICATION_STATUSES = [
  "brochure",
  "profile",
  "challenge",
  "dossier",
  "interview",
  "review",
  "administrative",
  "admitted",
  "rejected",
] as const;

export type CfaApplicationStatus = (typeof CFA_APPLICATION_STATUSES)[number];

export const CFA_STATUS_LABELS: Record<CfaApplicationStatus, string> = {
  brochure: "Téléchargement fiche cursus",
  profile: "Application",
  challenge: "Challenge",
  dossier: "Dossier",
  interview: "Entretien",
  review: "Review",
  administrative: "Éléments administratifs",
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
  cerfa_data?: Record<string, string> | null;
  administrative_documents?: Record<string, string> | null;
  administrative_document_urls?: Record<string, string> | null;
  private_files?: Record<string, CfaPrivateFile> | null;
  administrative_documents_submitted_at?: string | null;
  registration_fee_session_id?: string | null;
  registration_fee_paid_at?: string | null;
  admitted_at?: string | null;
  financing_path: "alternance" | "byound_start" | null;
  career_center_activated_at: string | null;
  created_at: string;
  updated_at: string;
};

export function getCfaSpecializationLabel(value: string): string {
  return CFA_SPECIALIZATIONS.find((item) => item.value === value)?.label ?? value;
}

export type CfaProgramDownload = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  specialization: string;
  created_at: string;
};
