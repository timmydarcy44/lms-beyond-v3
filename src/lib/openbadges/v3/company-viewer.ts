import { createSupabaseServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const COMPANY_ROLES = new Set(["entreprise", "enterprise", "admin_hr", "rh", "admin", "super_admin"]);

export async function viewerIsCompanyAccount() {
  const auth = await createSupabaseServerClient();
  if (!auth) return false;
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user?.id) return false;
  const db = getServiceRoleClient();
  if (!db) return false;
  const { data: profile } = await db.from("profiles").select("role, role_type").eq("id", user.id).maybeSingle();
  const role = String(profile?.role ?? "").trim().toLowerCase();
  const roleType = String(profile?.role_type ?? "").trim().toLowerCase();
  return COMPANY_ROLES.has(role) || COMPANY_ROLES.has(roleType);
}
