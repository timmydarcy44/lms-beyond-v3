/** Libellés affichés pour les rôles `profiles` / `org_memberships`. */
export const CRM_ROLE_LABELS: Record<string, string> = {
  learner: "Apprenant",
  student: "Student",
  instructor: "Formateur",
  admin: "Admin",
  tutor: "Tuteur",
  btoc: "B2C",
  entreprise: "Entreprise",
  ecole: "École",
  mentor: "Mentor",
  PARTICULIER: "Particulier",
  demo: "Démo",
  instructor_assistant: "Assistant formateur",
  expert: "Expert",
};

export function formatCrmRoleLabel(role: string): string {
  return CRM_ROLE_LABELS[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
}

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
  organizations: Array<{ id: string; name: string }>;
  firstName: string;
  lastName: string;
  createdAt: string | null;
  lastSignInAt: string | null;
  totalRevenue: number;
  testCount: number;
};
