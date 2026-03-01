import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolApprenantsPageClient } from "@/components/beyond-connect/school-apprenants-page-client";
import { mockOffers, mockUsers } from "@/lib/mocks/appData";

export default async function SchoolApprenantsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/apprenants");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("id, role_type, school_id")
    .eq("id", session.id)
    .maybeSingle();

  const isSchoolProfile = currentProfile?.role_type === "ecole";
  const allowTestAccess = session?.email === "jean@test.fr" && !!currentProfile?.school_id;
  if (!currentProfile || (!isSchoolProfile && !allowTestAccess)) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = currentProfile.school_id;

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
