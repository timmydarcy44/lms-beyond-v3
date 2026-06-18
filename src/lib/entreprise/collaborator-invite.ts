import { isEdgeEntrepriseSignupMetadata } from "@/lib/auth/edge-signup-flow";

export const COLLABORATOR_DASHBOARD_PATH = "/dashboard/salarie";
export const COLLABORATOR_INVITE_FLOW = "invite";

export function isCollaboratorInviteMetadata(
  metadata: Record<string, unknown> | null | undefined,
): boolean {
  if (!metadata) return false;
  if (metadata.employee_id) return true;
  const role = String(metadata.role ?? "").trim().toLowerCase();
  if (["employee", "salarie", "collaborateur", "collaborator"].includes(role)) {
    return true;
  }
  const orgId = metadata.organization_id ?? metadata.company_id;
  if (orgId && !isEdgeEntrepriseSignupMetadata(metadata)) {
    return true;
  }
  return false;
}

export function buildCollaboratorInviteMetadata(params: {
  firstName?: string;
  lastName?: string;
  organizationId: string;
  employeeId: string;
}): Record<string, unknown> {
  const firstName = String(params.firstName ?? "").trim();
  const lastName = String(params.lastName ?? "").trim();
  return {
    role: "employee",
    role_type: "salarie",
    first_name: firstName,
    last_name: lastName,
    prenom: firstName,
    nom: lastName,
    company_id: params.organizationId,
    organization_id: params.organizationId,
    employee_id: params.employeeId,
    needs_password_setup: true,
  };
}

/** URL absolue pour inviteUserByEmail.redirectTo et lien email custom. */
export function buildCollaboratorSetPasswordUrl(siteBase: string): string {
  const base = siteBase.replace(/\/$/, "");
  const next = encodeURIComponent(COLLABORATOR_DASHBOARD_PATH);
  return `${base}/auth/set-password?next=${next}&flow=${COLLABORATOR_INVITE_FLOW}`;
}

/** Chemin relatif (hash Supabase optionnel) pour AuthHashRedirect. */
export function buildCollaboratorSetPasswordPath(hash?: string): string {
  const next = encodeURIComponent(COLLABORATOR_DASHBOARD_PATH);
  const hashPart = hash?.startsWith("#") ? hash : hash ? `#${hash}` : "";
  return `/auth/set-password?next=${next}&flow=${COLLABORATOR_INVITE_FLOW}${hashPart}`;
}
