/** Intent demande formation (site → signup compte light). Stocké en sessionStorage. */

export const FORMATION_INTENT_KEY = "byound.formation_intent.v1";

export type FormationIntent = {
  courseId: string;
  courseTitle?: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  participants?: string;
  preferredPeriod?: string;
  preferredLocation?: string;
  fundingType?: "direct" | "opco";
  notes?: string;
  createdAt: string;
};

export function saveFormationIntent(intent: Omit<FormationIntent, "createdAt">): void {
  if (typeof window === "undefined") return;
  const payload: FormationIntent = {
    ...intent,
    createdAt: new Date().toISOString(),
  };
  try {
    window.sessionStorage.setItem(FORMATION_INTENT_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota */
  }
}

export function readFormationIntent(): FormationIntent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(FORMATION_INTENT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FormationIntent;
    if (!parsed?.courseId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearFormationIntent(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(FORMATION_INTENT_KEY);
  } catch {
    /* ignore */
  }
}

/** Soft flag session (si colonne DB pas encore migrée). */
export const FORMATION_ONLY_SESSION_KEY = "byound.formation_only.v1";

export function markFormationOnlySession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(FORMATION_ONLY_SESSION_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function readFormationOnlySession(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(FORMATION_ONLY_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

export function buildFormationSignupUrl(intent: {
  courseId: string;
  courseTitle?: string;
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
}): string {
  const q = new URLSearchParams({
    intent: "formation",
    mode: "signup",
  });
  if (intent.courseId) q.set("course", intent.courseId);
  if (intent.courseTitle) q.set("course_title", intent.courseTitle);
  if (intent.companyName) q.set("company", intent.companyName);
  if (intent.contactEmail) q.set("email", intent.contactEmail);
  if (intent.contactName) {
    const parts = intent.contactName.trim().split(/\s+/);
    if (parts[0]) q.set("first_name", parts[0]);
    if (parts.length > 1) q.set("last_name", parts.slice(1).join(" "));
  }
  return `/entreprises/connexion?${q.toString()}`;
}
