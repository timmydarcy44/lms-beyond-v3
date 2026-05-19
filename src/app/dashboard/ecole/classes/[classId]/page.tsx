import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  fetchSchoolGateProfile,
  resolveSchoolIdForEcoleDashboard,
  schoolDashboardAllowed,
} from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getMiddlewarePathname } from "@/lib/http/request-pathname";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { SchoolClassDetailClient } from "@/components/beyond-connect/school-class-detail-client";

export const dynamic = "force-dynamic";

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export default async function SchoolClassDetailPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  if (!isUuid(classId)) notFound();

  const session = await getSession();
  if (!session) redirect(`/login?next=/dashboard/ecole/classes/${classId}`);

  const supabase = await getServerClient();
  if (!supabase) redirect(`/login?next=/dashboard/ecole/classes/${classId}`);

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
  if (!schoolId) notFound();

  let listClient = supabase;
  try {
    listClient = await getServiceSupabase();
  } catch {
    /* RLS */
  }

  /* select('*') : évite une 404 si la migration cover/référentiel n'est pas encore appliquée (colonnes optionnelles). */
  const { data: classRow, error: classErr } = await listClient
    .from("school_classes")
    .select("*")
    .eq("id", classId)
    .eq("school_id", schoolId)
    .maybeSingle();

  if (classErr || !classRow) notFound();

  const row = classRow as Record<string, unknown>;
  const coverRaw = row.cover_image_url;
  const coverImageUrl = typeof coverRaw === "string" && coverRaw.trim() ? coverRaw.trim() : null;
  const initialStructure = row.referential_structure ?? null;

  const { data: enrollRows } = await listClient.from("class_enrollments").select("student_id").eq("class_id", classId);

  const studentIds = [...new Set((enrollRows || []).map((r) => String(r.student_id || "")).filter(Boolean))];

  let students: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    contract_type: string | null;
  }> = [];

  if (studentIds.length) {
    const { data: profs } = await listClient
      .from("profiles")
      .select("id, first_name, last_name, email, contract_type")
      .in("id", studentIds);
    students = (profs || []) as typeof students;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] px-4 py-8 text-[#1D1D1F] md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-[1000px] space-y-6">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/dashboard/ecole/classes" className="text-indigo-600 hover:underline">
            Mes classes
          </Link>
          <span className="text-black/30">/</span>
          <span className="truncate text-black/60">{classRow.name}</span>
        </div>

        <SchoolClassDetailClient
          classId={String(classRow.id)}
          className={String(classRow.name || "Cursus")}
          coverImageUrl={coverImageUrl}
          students={students}
          initialStructure={initialStructure}
        />
      </div>
    </div>
  );
}
