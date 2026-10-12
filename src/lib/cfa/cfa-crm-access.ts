import { isSuperAdmin } from "@/lib/auth/super-admin";
import { fetchSchoolGateProfile, schoolDashboardAllowed } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";

/** Lecture du CRM CFA : super-admin, ou équipe de l'espace école. */
export async function canReadCfaCrm(): Promise<boolean> {
  if (await isSuperAdmin()) return true;
  const session = await getSession();
  if (!session?.id) return false;
  const supabase = await getServerClient();
  if (!supabase) return false;
  const gate = await fetchSchoolGateProfile(session.id, session.email, supabase);
  return schoolDashboardAllowed({
    isDemoSession: session.role === "demo",
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: "/dashboard/ecole/recrutement/prospects",
  });
}
