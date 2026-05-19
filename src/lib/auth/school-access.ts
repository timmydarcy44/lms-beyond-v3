import type { SupabaseClient } from "@supabase/supabase-js";

import {
  isEcoleHandicapSectionPath,
  shouldRestrictSchoolDashboardToHandicapOnly,
} from "@/lib/auth/school-role-type-guards";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

/** Normalise un rôle / role_type pour comparaisons stables (casse + accents). */
export function normalizeProfileRoleKey(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/**
 * Rôle « espace école » : `ecole` exact, ou suffixes/préfixes métier (`*_ecole`, `ecole_*`).
 */
export function normalizeSchoolRoleToken(value: unknown): string {
  const n = normalizeProfileRoleKey(value);
  if (!n) return "";
  if (n === "ecole" || n.endsWith("_ecole") || n.startsWith("ecole_")) return "ecole";
  return n;
}

export type SchoolGateProfile = {
  role: string;
  roleType: string;
  school_id: string | null;
};

type ProfileGateRow = {
  id: string;
  role: string | null;
  role_type: string | null;
  school_id: string | null;
};

function mapGateRow(row: ProfileGateRow): SchoolGateProfile {
  return {
    role: normalizeSchoolRoleToken(row.role) || normalizeProfileRoleKey(row.role),
    roleType: normalizeProfileRoleKey(row.role_type),
    school_id: row.school_id ?? null,
  };
}

export function profileRolesIndicateSchoolDashboard(role: unknown, roleType: unknown): boolean {
  const r = normalizeSchoolRoleToken(role) || normalizeProfileRoleKey(role);
  const rt = normalizeProfileRoleKey(roleType);
  if (r === "demo" || rt === "demo") return false;
  return (
    r === "ecole" ||
    SCHOOL_ROLE_KEYS.has(r) ||
    SCHOOL_ROLE_KEYS.has(rt) ||
    normalizeSchoolRoleToken(roleType) === "ecole"
  );
}

export async function fetchSchoolGateProfile(
  userId: string,
  email: string | null | undefined,
  supabaseUser: SupabaseClient,
): Promise<SchoolGateProfile | null> {
  const { data: rlsRow } = await supabaseUser
    .from("profiles")
    .select("id, role, role_type, school_id")
    .eq("id", userId)
    .maybeSingle();

  let row = rlsRow as ProfileGateRow | null;
  const service = await getServiceRoleClientOrFallback();

  if (!row && service) {
    const { data: svcById } = await service
      .from("profiles")
      .select("id, role, role_type, school_id")
      .eq("id", userId)
      .maybeSingle();
    row = svcById as ProfileGateRow | null;
  }

  const emailNorm = String(email ?? "").trim().toLowerCase();
  if (!row && emailNorm && service) {
    const { data: svcByEmail } = await service
      .from("profiles")
      .select("id, role, role_type, school_id")
      .eq("email", emailNorm)
      .order("updated_at", { ascending: false })
      .limit(5);
    const rows = (svcByEmail as ProfileGateRow[] | null) ?? [];
    row = rows.find((r) => r.id === userId) ?? rows[0] ?? null;
  }

  if (!row) return null;
  return mapGateRow(row);
}

/**
 * CFA : `profiles.school_id`, sinon premier org staff dans `org_memberships`.
 */
export async function resolveSchoolIdForEcoleDashboard(
  userId: string,
  email: string | null | undefined,
  supabaseUser: SupabaseClient,
): Promise<string | null> {
  const gate = await fetchSchoolGateProfile(userId, email, supabaseUser);
  if (gate?.school_id) return gate.school_id;

  const service = await getServiceRoleClientOrFallback();
  if (!service) return null;

  const staffRoles = ["admin", "instructor", "tutor"];

  const { data, error } = await service
    .from("org_memberships")
    .select("org_id")
    .eq("user_id", userId)
    .in("role", staffRoles)
    .order("created_at", { ascending: true })
    .limit(5);

  if (!error && data?.length) {
    const id = (data[0] as { org_id?: string }).org_id;
    if (id) return String(id);
  }

  if (error?.code === "42703") {
    const { data: alt } = await service
      .from("org_memberships")
      .select("organisation_id")
      .eq("user_id", userId)
      .in("role", staffRoles)
      .limit(5);
    const oid = (alt?.[0] as { organisation_id?: string })?.organisation_id;
    if (oid) return String(oid);
  }

  return null;
}

const SCHOOL_ROLE_KEYS = new Set([
  "ecole",
  "school",
  "cfa",
  "admin_ecole",
  "admin_school",
  "etablissement",
  "establishment",
  "organisme_de_formation",
  "gestionnaire_ecole",
  "coordonnateur_pedagogique",
]);

export function schoolDashboardAllowed(input: {
  isDemoSession: boolean;
  sessionFrontendRole?: string | null;
  role: string;
  roleType: string;
  schoolIdPresent: boolean;
  profileRowPresent: boolean;
  requestPath?: string | null;
}): boolean {
  if (input.isDemoSession) return true;

  const pathRaw = String(input.requestPath ?? "").trim();
  const path = pathRaw.split("?")[0] || "";

  if (shouldRestrictSchoolDashboardToHandicapOnly({ profileRole: input.role, profileRoleType: input.roleType })) {
    if (!input.profileRowPresent) return false;
    if (!path) return false;
    const role = normalizeSchoolRoleToken(input.role) || input.role;
    const rt = input.roleType;
    const isSchoolProfile =
      role === "ecole" ||
      role === "admin" ||
      role === "demo" ||
      SCHOOL_ROLE_KEYS.has(role) ||
      SCHOOL_ROLE_KEYS.has(rt) ||
      normalizeSchoolRoleToken(rt) === "ecole";
    if (!isSchoolProfile && !input.schoolIdPresent) return false;
    if (path.startsWith("/dashboard/ecole")) {
      return isEcoleHandicapSectionPath(path);
    }
    return true;
  }

  const sfr =
    normalizeSchoolRoleToken(input.sessionFrontendRole) || normalizeProfileRoleKey(input.sessionFrontendRole);
  if (sfr === "ecole" || sfr === "admin" || sfr === "formateur") return true;

  if (!input.profileRowPresent) return false;

  const role = normalizeSchoolRoleToken(input.role) || input.role;
  const rt = input.roleType;

  const isSchoolProfile =
    role === "ecole" ||
    role === "admin" ||
    role === "demo" ||
    SCHOOL_ROLE_KEYS.has(role) ||
    SCHOOL_ROLE_KEYS.has(rt) ||
    normalizeSchoolRoleToken(rt) === "ecole";

  return isSchoolProfile || input.schoolIdPresent;
}
