import { Suspense } from "react";
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
import { SchoolApprenantsPageClient } from "@/components/beyond-connect/school-apprenants-page-client";
import { mockOffers } from "@/lib/mocks/appData";

export const dynamic = "force-dynamic";

async function ApprenantsContent({
  initialAddOpen,
  initialClassId,
}: {
  initialAddOpen: boolean;
  initialClassId: string;
}) {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/ecole/apprenants");

  const supabase = await getServerClient();
  if (!supabase) redirect("/login?next=/dashboard/ecole/apprenants");

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

  let studentsRows: unknown[] = [];
  let classOptions: { id: string; name: string | null }[] = [];
  if (schoolId) {
    let listClient = supabase;
    try {
      listClient = await getServiceSupabase();
    } catch {
      /* RLS navigateur si pas de service role */
    }

    const [{ data: apprenantsRows, error: apprenantsError }, { data: classesRows }] = await Promise.all([
      listClient
        .from("school_students")
        .select("student:profiles!school_students_student_id_fkey(*)")
        .eq("school_id", schoolId),
      listClient.from("school_classes").select("id, name").eq("school_id", schoolId).order("name", { ascending: true }),
    ]);

    if (apprenantsError) {
      console.error("Erreur chargement apprenants:", apprenantsError.message);
    } else {
      studentsRows = (apprenantsRows ?? [])
        .map((row: { student?: unknown }) => row.student)
        .filter(Boolean);
    }
    classOptions = (classesRows ?? []) as { id: string; name: string | null }[];
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1400px] space-y-6">
        <SchoolApprenantsPageClient
          studentsRows={studentsRows as any}
          offers={mockOffers}
          schoolId={schoolId}
          classOptions={classOptions}
        />
      </div>
    </div>
  );
}

export default async function SchoolApprenantsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const addRaw = sp.add;
  const add = addRaw === "1" || addRaw === "true" || (Array.isArray(addRaw) && addRaw[0] === "1");
  const cidRaw = sp.classId;
  const initialClassId = typeof cidRaw === "string" ? cidRaw : Array.isArray(cidRaw) ? String(cidRaw[0] ?? "") : "";

  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ApprenantsContent initialAddOpen={add} initialClassId={initialClassId} />
    </Suspense>
  );
}
