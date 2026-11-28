import { isCareAudience } from "@/lib/control/care-audience";

/** Libellés affichés pour les rôles `profiles` / `org_memberships`. */
export const CRM_ROLE_LABELS: Record<string, string> = {
  learner: "Apprenant",
  student: "Apprenant (student)",
  apprenant: "Apprenant",
  instructor: "Formateur",
  formateur: "Formateur",
  admin: "Administrateur",
  tutor: "Tuteur",
  super_admin: "Super administrateur",
  btoc: "Online",
  entreprise: "Entreprise",
  admin_hr: "Admin RH",
  manager: "Manager",
  client: "Client",
  ecole: "École",
  mentor: "Mentor",
  PARTICULIER: "Client online",
  particulier: "Client online",
  care_patient: "Patient Care",
  patient: "Patient Care",
  demo: "Démo",
  instructor_assistant: "Assistant formateur",
  expert: "Expert",
  praticien: "Praticien",
  praticien_bct: "Praticien BCT",
  salarie: "Salarié",
  collaborateur: "Collaborateur",
  employee: "Employé",
  club: "Club",
  partenaire: "Partenaire",
};

/** Rôles autorisés côté `profiles` (alignés sur la contrainte SQL). */
export const CRM_PROFILE_ROLES = [
  "learner",
  "student",
  "apprenant",
  "instructor",
  "formateur",
  "admin",
  "tutor",
  "super_admin",
  "entreprise",
  "admin_hr",
  "manager",
  "client",
  "ecole",
  "mentor",
  "PARTICULIER",
  "particulier",
  "demo",
  "expert",
  "praticien",
  "praticien_bct",
  "salarie",
  "collaborateur",
  "employee",
  "club",
  "partenaire",
] as const;

export type CrmProfileRole = (typeof CRM_PROFILE_ROLES)[number];

export function formatCrmRoleLabel(role: string): string {
  return CRM_ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

export const CRM_PROFILE_ROLE_OPTIONS = CRM_PROFILE_ROLES.map((value) => ({
  value,
  label: formatCrmRoleLabel(value),
}));

export function splitFullName(fullName: string | null): { firstName: string; lastName: string } {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return { firstName: "—", lastName: "—" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "—" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

export type CrmUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  roleType?: string | null;
  organizations: Array<{ id: string; name: string }>;
  firstName: string;
  lastName: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  totalRevenue: number;
  testCount: number;
};

/** Rôles « apprenant / particulier » acceptés en client online (exclut tuteur, club, Care…). */
const CRM_BTOC_LEARNER_ROLES = new Set([
  "learner",
  "student",
  "apprenant",
  "btoc",
  "particulier",
  "PARTICULIER",
]);

/**
 * Client online = achat de formations à l’unité.
 * Pas les patients / coachs Care, même si `role_type` est (à tort) `particulier`.
 */
export function isCrmBtocUser(user: {
  id?: string | null;
  email?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  role?: string | null;
  roleType?: string | null;
}) {
  const name = [user.firstName, user.lastName, user.fullName]
    .map((part) => String(part ?? "").trim())
    .filter((part) => part && part !== "—")
    .join(" ");
  if (isCareAudience({ id: user.id, email: user.email, name, role: user.role, roleType: user.roleType })) {
    return false;
  }
  const role = String(user.role ?? "").trim();
  const roleType = String(user.roleType ?? "").trim().toLowerCase();
  if (!CRM_BTOC_LEARNER_ROLES.has(role)) return false;
  if (["btoc", "particulier", "PARTICULIER"].includes(role)) return true;
  return roleType === "particulier" || roleType === "btoc";
}
