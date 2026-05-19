import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { loadSchoolOverviewData } from "@/lib/dashboard/ecole-overview-data";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { SchoolDashboard } from "@/components/beyond-connect/school-dashboard";

export const dynamic = "force-dynamic";

export default async function SchoolDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole");
  }

  const gateProfile = await fetchSchoolGateProfile(session.id, session.email, supabase);
  const isDemo = session.role === "demo";
  const requestPath = await getMiddlewarePathname();
  const allowed = schoolDashboardAllowed({
    isDemoSession: isDemo,
    sessionFrontendRole: session.role,
    role: gateProfile?.role ?? "",
    roleType: gateProfile?.roleType ?? "",
    schoolIdPresent: Boolean(gateProfile?.school_id),
    profileRowPresent: Boolean(gateProfile),
    requestPath: requestPath || undefined,
  });

  if (!allowed) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);

  if (!schoolId) {
    return (
      <SchoolDashboard
        apprenants={[]}
        entreprises={[]}
        effectifTotal={0}
        alternancesSignees={0}
        apprenantsEnRecherche={0}
        offersCount={0}
        latestOffers={[]}
        latestConnected={[]}
        recentActivities={[]}
        fullName={session.fullName || session.email || "Utilisateur"}
      />
    );
  }

  let listClient = supabase;
  try {
    listClient = await getServiceSupabase();
  } catch {
    /* RLS navigateur si pas de service role */
  }

  const overview = await loadSchoolOverviewData(schoolId, listClient);

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 pt-6">
        <div className="fixed left-0 right-0 top-0 z-50 border-b border-[#E5E5EA] bg-white/95 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1D1D1F] shadow-sm backdrop-blur">
          ⚠️ MODE DÉMO : ADMIN PRIVILÉGIÉ
        </div>
        <SchoolDashboard
          apprenants={overview.apprenants}
          entreprises={overview.entreprises}
          effectifTotal={overview.effectifTotal}
          alternancesSignees={overview.alternancesSignees}
          apprenantsEnRecherche={overview.apprenantsEnRecherche}
          offersCount={overview.offersCount}
          latestOffers={overview.latestOffers}
          latestConnected={overview.latestConnected}
          recentActivities={overview.recentActivities}
          fullName={session.fullName || session.email || "Utilisateur"}
        />
      </div>
    </div>
  );
}

