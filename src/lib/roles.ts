export type RoleContext = "entreprise" | "cfa";

const LABELS: Record<string, string> = {
  admin: "Responsable RH",
  admin_hr: "Responsable RH",
  entreprise: "Responsable RH",
  rh: "Responsable RH",
  manager: "Responsable RH",
  trainer: "Formateur",
  instructor: "Formateur",
  formateur: "Formateur",
  tutor: "Tuteur",
  handicap_referent: "Référent handicap",
};

export function roleLabel(role: string | null | undefined, context: RoleContext = "entreprise") {
  const key = String(role ?? "").trim().toLowerCase();
  if (!key) return context === "cfa" ? "Apprenant" : "Collaborateur";
  if (key === "learner" || key === "student" || key === "apprenant" || key === "salarie") {
    return context === "cfa" ? "Apprenant" : "Collaborateur";
  }
  return LABELS[key] ?? (context === "cfa" ? "Apprenant" : "Collaborateur");
}

export function roleTone(role: string | null | undefined): "admin" | "tutor" | "invited" | "member" {
  const key = String(role ?? "").trim().toLowerCase();
  if (key === "invited" || key === "pending") return "invited";
  if (key === "tutor") return "tutor";
  if (key === "admin" || key === "admin_hr" || key === "entreprise" || key === "rh" || key === "manager") return "admin";
  return "member";
}
