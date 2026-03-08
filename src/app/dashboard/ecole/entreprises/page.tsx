import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolEntreprisesPageClient } from "@/components/beyond-connect/school-entreprises-page-client";

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

  const { data: profileById } = await supabase
    .from("profiles")
    .select("id, role_type, school_id")
    .eq("id", session.id)
    .maybeSingle();
  let currentProfile = profileById;
  if (!currentProfile && session.email) {
    const { data: profileByEmail } = await supabase
      .from("profiles")
      .select("id, role_type, school_id")
      .eq("email", session.email)
      .maybeSingle();
    currentProfile = profileByEmail ?? null;
  }

  const normalizedRole = String(currentProfile?.role_type ?? "").trim().toLowerCase();
  const isSchoolProfile = ["ecole", "school", "cfa", "admin_ecole", "admin_school"].includes(normalizedRole);
  const hasSchoolScope = Boolean(currentProfile?.school_id);
  if (!isDemo && (!currentProfile || (!isSchoolProfile && !hasSchoolScope))) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = currentProfile?.school_id ?? null;

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
        <SchoolEntreprisesPageClient companies={prospects || []} />
      </div>
    </div>
  );
}
