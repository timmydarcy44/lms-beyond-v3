import { redirect } from "next/navigation";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { SchoolEcoleOffersPageClient, type EcoleJobRow } from "@/components/beyond-connect/school-ecole-offers-page-client";

export const dynamic = "force-dynamic";

export default async function SchoolOffersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/ecole/offres");

  const supabase = await getServerClient();
  if (!supabase) redirect("/login?next=/dashboard/ecole/offres");

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

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);

  let listClient = supabase;
  try {
    listClient = await getServiceSupabase();
  } catch {
    /* RLS */
  }

  const { data: offers } = schoolId
    ? await listClient
        .from("job_offers")
        .select("id, title, city, salary, description, status, contract_type, created_at")
        .eq("school_id", schoolId)
        .order("created_at", { ascending: false })
    : { data: [] as EcoleJobRow[] };

  const rows = (offers || []) as EcoleJobRow[];

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <SchoolEcoleOffersPageClient schoolId={schoolId} initialOffers={rows} />
      </div>
    </div>
  );
}
