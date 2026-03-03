import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getServerClient } from "@/lib/supabase/server";
import { SchoolClassesPageClient } from "@/components/beyond-connect/school-classes-page-client";
import { SchoolClassCreateModal } from "@/components/beyond-connect/school-class-create-modal";
export const revalidate = 0;

export default async function SchoolClassesPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?next=/dashboard/ecole/classes");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/login?next=/dashboard/ecole/classes");
  }

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
  if (!currentProfile || (!isSchoolProfile && !hasSchoolScope)) {
    redirect("/dashboard/apprenant");
  }

  const schoolId = currentProfile.school_id;
  console.log("SCHOOL_ID_USED:", schoolId);

  const { data: students } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, email, phone, school_class, contract_type")
    .eq("school_id", schoolId)
    .in("role_type", ["STUDENT", "apprenant"]);

  const { data: schoolClasses, error: classesError } = await supabase
    .from("school_classes")
    .select("*")
    .eq("school_id", schoolId);
  console.log("CLASSES_FOUND:", schoolClasses, classesError);

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex justify-end">
          <SchoolClassCreateModal students={students || []} schoolId={schoolId} />
        </div>
        <SchoolClassesPageClient students={students || []} classRows={schoolClasses || []} />
      </div>
    </div>
  );
}
