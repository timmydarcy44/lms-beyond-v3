import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolDashboard } from "@/components/beyond-connect/school-dashboard";

const getTopSkills = () => [];

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_type: string | null;
  phone?: string | null;
  class_name?: string | null;
  class?: string | null;
  promo?: string | null;
  soft_skills_scores?: Record<string, number> | null;
};

export default async function SchoolDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole");
  }

  const { data: fullProfile } = await supabase
    .from("profiles")
    .select("id, role, role_type, school_id")
    .eq("id", session.id)
    .maybeSingle();

  const role = String(fullProfile?.role ?? "").trim().toLowerCase();
  const roleType = String(fullProfile?.role_type ?? "").trim().toLowerCase();
  const isDemo = session.role === "demo";
  const isSchoolProfile =
    role === "ecole" ||
    role === "admin" ||
    role === "demo" ||
    ["ecole", "school", "cfa", "admin_ecole", "admin_school"].includes(roleType);
  const hasSchoolScope = Boolean(fullProfile?.school_id);

  if (!isDemo && (!fullProfile || (!isSchoolProfile && !hasSchoolScope))) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = fullProfile?.school_id ?? null;
  console.log("School ID détecté:", schoolId);

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

  const { data: apprenantsRows, error: apprenantsError } = await supabase
    .from("school_students")
    .select("student:profiles!school_students_student_id_fkey(*)")
    .eq("school_id", schoolId);
  if (apprenantsError) {
    console.error("Erreur Supabase apprenants :", apprenantsError.message);
  }
  const apprenants = (apprenantsRows || [])
    .map((row) => row.student)
    .filter(Boolean) as unknown as ProfileRow[];

  const { data: entreprises } = await supabase
    .from("profiles")
    .select("*")
    .eq("school_id", schoolId)
    .eq("role_type", "entreprise");

  const { data: latestOffers } = await supabase
    .from("job_offers")
    .select("id, title, city, salary, description, school_id")
    .eq("school_id", schoolId)
    .limit(5);

  const { data: latestConnected } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, updated_at, role_type")
    .eq("school_id", schoolId)
    .order("updated_at", { ascending: false })
    .limit(5);

  const talentIds = (apprenants || []).map((row) => row.id);
  const { data: recentApplications } = talentIds.length
    ? await supabase
        .from("applications")
        .select("id, job_id, talent_id, created_at, status")
        .in("talent_id", talentIds)
        .order("created_at", { ascending: false })
        .limit(5)
    : { data: [] };

  const { count: apprenantsCount } = await supabase
    .from("school_students")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const { count: entreprisesCount } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId)
    .eq("role_type", "entreprise");

  const { count: offersCount } = await supabase
    .from("job_offers")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);

  const isSigned = (profile: Record<string, any>) => {
    const status =
      profile.contract_status ||
      profile.status ||
      profile.employment_status ||
      profile.alternance_status ||
      "";
    return typeof status === "string" && ["signe", "signé", "active", "en poste"].some((t) => status.toLowerCase().includes(t));
  };

  const isSearching = (profile: Record<string, any>) => {
    const status =
      profile.contract_status ||
      profile.status ||
      profile.employment_status ||
      profile.alternance_status ||
      "";
    return typeof status === "string" && ["recherche", "search", "open"].some((t) => status.toLowerCase().includes(t));
  };

  const totalEffectif = (apprenants || []).length;
  const alternancesSignees = (apprenants || []).filter(isSigned).length;
  const apprenantsEnRecherche = (apprenants || []).filter(isSearching).length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-4 pt-6">
        <div className="fixed left-0 right-0 top-0 z-50 border-b border-[#E5E5EA] bg-white/95 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#1D1D1F] shadow-sm backdrop-blur">
          ⚠️ MODE DÉMO : ADMIN PRIVILÉGIÉ
        </div>
        <SchoolDashboard
          apprenants={apprenants}
          entreprises={entreprises}
          effectifTotal={totalEffectif}
          alternancesSignees={alternancesSignees}
          apprenantsEnRecherche={apprenantsEnRecherche}
          offersCount={offersCount || 0}
          latestOffers={latestOffers || []}
          latestConnected={latestConnected || []}
          recentActivities={recentApplications || []}
          fullName={session.fullName || session.email || "Utilisateur"}
        />
      </div>
    </div>
  );
}
