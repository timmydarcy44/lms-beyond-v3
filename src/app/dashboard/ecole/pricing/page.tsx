import { redirect } from "next/navigation";
import {
  fetchSchoolGateProfile,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { EcolePricingPanel } from "@/components/beyond-connect/ecole-pricing-panel";

export const dynamic = "force-dynamic";

export default async function EcolePricingPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/ecole/pricing");

  const supabase = await getServerClient();
  if (!supabase) redirect("/login?next=/dashboard/ecole/pricing");

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

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <EcolePricingPanel variant="dashboard" />
      </div>
    </div>
  );
}
