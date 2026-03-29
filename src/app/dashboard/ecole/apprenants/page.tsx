import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolApprenantsPageClient } from "@/components/beyond-connect/school-apprenants-page-client";
import { mockOffers, mockUsers } from "@/lib/mocks/appData";

export const dynamic = "force-dynamic";

async function ApprenantsContent() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/apprenants");
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

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <SchoolApprenantsPageClient
          studentsRows={mockUsers}
          offers={mockOffers}
          schoolId={schoolId}
        />
      </div>
    </div>
  );
}

export default function SchoolApprenantsPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ApprenantsContent />
    </Suspense>
  );
}
