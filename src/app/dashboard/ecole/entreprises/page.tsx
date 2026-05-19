import { redirect } from "next/navigation";
import { fetchSchoolGateProfile, schoolDashboardAllowed } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolEntreprisesPageClient } from "@/components/beyond-connect/school-entreprises-page-client";

export const dynamic = 'force-dynamic';


export default async function SchoolEntreprisesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/entreprises");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/entreprises");
  }

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

  const schoolId = gate?.school_id ?? null;

  const { data: prospects } = await supabase
    .from("crm_prospects")
    .select("*")
    .eq("school_id", schoolId)
    .eq("company_status", "client");

  console.log("Données entreprises:", prospects);

  return (
    <div className="min-h-screen bg-white px-8 py-10 text-black">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="rounded-[24px] border border-white/10 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold">Entreprises</h1>
          <p className="mt-2 text-sm text-black/60">Gestion des entreprises partenaires.</p>
        </header>
        <SchoolEntreprisesPageClient schoolId={schoolId ?? ""} companies={prospects || []} />
      </div>
    </div>
  );
}

