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
import { SchoolClassesPageClient } from "@/components/beyond-connect/school-classes-page-client";
import { SchoolClassCreateModal } from "@/components/beyond-connect/school-class-create-modal";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SchoolClassesPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/ecole/classes");

  const supabase = await getServerClient();
  if (!supabase) redirect("/login?next=/dashboard/ecole/classes");

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

  const { data: students } = schoolId
    ? await listClient
        .from("profiles")
        .select("id, first_name, last_name, email, phone, school_class, contract_type")
        .eq("school_id", schoolId)
        .or("role_type.eq.apprenant,role_type.eq.student,role_type.eq.STUDENT,role_type.eq.stagiaire,role_type.eq.alternant")
    : { data: [] as const };

  const { data: schoolClasses, error: classesError } = schoolId
    ? await listClient.from("school_classes").select("*").eq("school_id", schoolId)
    : { data: [], error: null };
  if (classesError) console.error("CLASSES_QUERY:", classesError.message);

  const classIds = (schoolClasses || []).map((c: { id?: string }) => String(c.id || "")).filter(Boolean);
  const { data: classEnrollments } =
    schoolId && classIds.length
      ? await listClient.from("class_enrollments").select("class_id, student_id").in("class_id", classIds)
      : { data: [] as const };

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <div className="flex justify-end">
          <SchoolClassCreateModal students={students || []} schoolId={schoolId} />
        </div>
        <SchoolClassesPageClient
          students={students || []}
          classRows={schoolClasses || []}
          classEnrollments={(classEnrollments || []) as { class_id: string; student_id: string }[]}
        />
      </div>
    </div>
  );
}
