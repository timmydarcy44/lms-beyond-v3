import { redirect } from "next/navigation";

import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { resolveEntrepriseAssistantAccess } from "@/lib/entreprise/assistant-access";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";

export async function requireEcoleOrgId(nextPath: string): Promise<{ orgId: string; userId: string }> {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const supabase = await getServerClient();
  if (!supabase) redirect(`/login?next=${encodeURIComponent(nextPath)}`);

  const isDemo = session.role === "demo";
  const gate = await fetchSchoolGateProfile(session.id, session.email, supabase);
  const requestPath = await getMiddlewarePathname();
  const ok = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gate?.role ?? "",
    roleType: gate?.roleType ?? "",
    schoolIdPresent: Boolean(gate?.school_id),
    profileRowPresent: Boolean(gate),
    requestPath: requestPath || undefined,
  });
  if (!ok) redirect("/dashboard/apprenant");

  const orgId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!orgId) {
    redirect("/dashboard/ecole");
  }
  return { orgId, userId: session.id };
}

export async function requireEntrepriseOrgId(nextPath: string): Promise<{ orgId: string; userId: string }> {
  const access = await resolveEntrepriseAssistantAccess();
  if (!access.ok) {
    if (access.status === 401) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
    if (access.redirect) redirect(access.redirect);
    redirect("/dashboard/entreprise");
  }
  return { orgId: access.organizationId, userId: access.userId };
}
