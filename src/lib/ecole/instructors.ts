export const INSTRUCTOR_STATUSES = ["active", "invited", "incomplete", "inactive"] as const;
export type InstructorStatus = (typeof INSTRUCTOR_STATUSES)[number];

export const INSTRUCTOR_STATUS_LABELS: Record<InstructorStatus, string> = {
  active: "Actif",
  invited: "Invitation envoyée",
  incomplete: "Profil incomplet",
  inactive: "Inactif",
};

export const CANDIDATE_STATUSES = [
  "new",
  "review",
  "contact",
  "interview",
  "retained",
  "refused",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATUSES)[number];

export const CANDIDATE_STATUS_LABELS: Record<CandidateStatus, string> = {
  new: "Nouvelle candidature",
  review: "À étudier",
  contact: "À contacter",
  interview: "Entretien",
  retained: "Retenu",
  refused: "Refusé",
};

export type SchoolInstructor = {
  id: string;
  school_id: string;
  profile_id?: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  photo_url?: string | null;
  address?: string | null;
  expertise?: string[] | null;
  teachable_subjects?: string[] | null;
  status: InstructorStatus | string;
  availability?: Record<string, unknown> | null;
  job_title?: string | null;
  company?: string | null;
  bio?: string | null;
  linkedin_url?: string | null;
  pedagogical_experience?: string | null;
  levels?: string[] | null;
  internal_notes?: string | null;
  invited_at?: string | null;
  activated_at?: string | null;
  hours_assigned?: number;
};

export function instructorDisplayName(i: {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}) {
  const name = `${String(i.first_name ?? "").trim()} ${String(i.last_name ?? "").trim()}`.trim();
  return name || String(i.email ?? "").trim() || "Formateur";
}

export function parseStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

export const INVITE_TTL_DAYS = 14;
