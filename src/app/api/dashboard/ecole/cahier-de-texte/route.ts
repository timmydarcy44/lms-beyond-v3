import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function resolveSchoolClient() {
  const session = await getSession();
  if (!session?.id) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) return { error: NextResponse.json({ error: "NO_SCHOOL" }, { status: 403 }) };
  const db = getServiceRoleClient() ?? supabase;
  return { session, schoolId, db };
}

/** Liste des cahiers de texte école (filtrable). */
export async function GET(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const url = new URL(req.url);
  const classId = url.searchParams.get("classId");
  const instructorId = url.searchParams.get("instructorId");
  const moduleId = url.searchParams.get("moduleId");
  const curriculumId = url.searchParams.get("curriculumId");
  const status = url.searchParams.get("status"); // pending | completed | all
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = db
    .from("school_planning_slots")
    .select(
      `
      id, starts_at, ends_at, duration_hours, status, class_id, module_id, instructor_id,
      lesson_content, lesson_objectives, lesson_homework, lesson_resources, lesson_completed_at,
      title, event_type,
      module:school_planning_modules(id, name, curriculum_module_id),
      class:school_classes(id, name, curriculum_id),
      instructor:school_instructors(id, first_name, last_name, email)
    `,
    )
    .eq("school_id", schoolId)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: false })
    .limit(200);

  if (classId) query = query.eq("class_id", classId);
  if (instructorId) query = query.eq("instructor_id", instructorId);
  if (moduleId) query = query.eq("module_id", moduleId);
  if (from) query = query.gte("starts_at", from);
  if (to) query = query.lte("starts_at", to);
  if (status === "completed") query = query.not("lesson_completed_at", "is", null);
  if (status === "pending") query = query.is("lesson_completed_at", null);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  let sessions = data ?? [];
  if (curriculumId) {
    sessions = sessions.filter((s: { class?: { curriculum_id?: string } | null }) => {
      return String(s.class?.curriculum_id ?? "") === curriculumId;
    });
  }

  return NextResponse.json({ sessions });
}
