import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await resolveSchoolClient();
  if ("error" in auth && auth.error) return auth.error;
  const { schoolId, db } = auth as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };
  const { id } = await ctx.params;

  const { data: curriculum, error } = await db
    .from("school_curricula")
    .select("*")
    .eq("id", id)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!curriculum) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const [{ data: modules }, { data: classes }] = await Promise.all([
    db
      .from("school_curriculum_modules")
      .select("*")
      .eq("curriculum_id", id)
      .order("sort_order"),
    db.from("school_classes").select("id, name, promotion, school_year_id").eq("curriculum_id", id),
  ]);

  const moduleIds = (modules ?? []).map((m: { id: string }) => m.id);
  const hoursByCurriculumModule = new Map<string, number>();
  const deliveredByCurriculumModule = new Map<string, number>();
  if (moduleIds.length) {
    const { data: planningMods } = await db
      .from("school_planning_modules")
      .select("id, curriculum_module_id")
      .in("curriculum_module_id", moduleIds);
    const planToCur = new Map(
      (planningMods ?? []).map((p: { id: string; curriculum_module_id: string }) => [
        p.id,
        p.curriculum_module_id,
      ]),
    );
    const planningIds = [...planToCur.keys()];
    if (planningIds.length) {
      const { data: slots } = await db
        .from("school_planning_slots")
        .select("module_id, duration_hours, lesson_completed_at")
        .in("module_id", planningIds)
        .neq("status", "cancelled");
      for (const s of slots ?? []) {
        const curMod = planToCur.get(String((s as { module_id: string }).module_id));
        if (!curMod) continue;
        const hours = Number((s as { duration_hours?: number }).duration_hours ?? 0);
        hoursByCurriculumModule.set(curMod, (hoursByCurriculumModule.get(curMod) ?? 0) + hours);
        if ((s as { lesson_completed_at?: string | null }).lesson_completed_at) {
          deliveredByCurriculumModule.set(
            curMod,
            (deliveredByCurriculumModule.get(curMod) ?? 0) + hours,
          );
        }
      }
    }
  }

  const modulesWithVolumes = (modules ?? []).map((m: Record<string, unknown>) => {
    const planned = Math.round((hoursByCurriculumModule.get(String(m.id)) ?? 0) * 100) / 100;
    const delivered = Math.round((deliveredByCurriculumModule.get(String(m.id)) ?? 0) * 100) / 100;
    const total = Number(m.planned_hours_total ?? 0);
    return {
      ...m,
      hours_planned: planned,
      hours_delivered: delivered,
      hours_remaining_to_schedule: Math.round((total - planned) * 100) / 100,
      hours_remaining_to_deliver: Math.round((total - delivered) * 100) / 100,
      hours_remaining: Math.round((total - planned) * 100) / 100,
    };
  });

  return NextResponse.json({
    curriculum,
    modules: modulesWithVolumes,
    classes: classes ?? [],
  });
}

export async function POST(req: Request, ctx: Ctx) {
  const auth = await resolveSchoolClient();
  if ("error" in auth && auth.error) return auth.error;
  const { schoolId, db } = auth as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };
  const { id } = await ctx.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  if (body.action === "add_module") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    const hours = Number(body.planned_hours_total ?? 0);
    const description = body.description ? String(body.description) : null;
    const learningObjectives = body.learning_objectives
      ? String(body.learning_objectives)
      : null;
    const { data, error } = await db
      .from("school_curriculum_modules")
      .insert({
        curriculum_id: id,
        school_id: schoolId,
        name,
        code: body.code ? String(body.code) : null,
        description,
        learning_objectives: learningObjectives,
        planned_hours_total: hours,
        sort_order: Number(body.sort_order ?? 0),
        online_course_id: body.online_course_id ? String(body.online_course_id) : null,
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    // Miroir planning : crée le module planifiable avec le volume du cursus
    await db.from("school_planning_modules").insert({
      school_id: schoolId,
      name,
      code: body.code ? String(body.code) : null,
      planned_hours_total: hours,
      curriculum_module_id: data.id,
      class_id: body.class_id ? String(body.class_id) : null,
      school_year_id: body.school_year_id ? String(body.school_year_id) : null,
    });

    // Recalcule le volume total cursus = somme des modules
    const { data: allMods } = await db
      .from("school_curriculum_modules")
      .select("planned_hours_total")
      .eq("curriculum_id", id);
    const sum = (allMods ?? []).reduce(
      (a: number, r: { planned_hours_total?: number }) => a + Number(r.planned_hours_total ?? 0),
      0,
    );
    await db.from("school_curricula").update({ total_hours: sum }).eq("id", id);

    return NextResponse.json({ module: data, total_hours: sum });
  }

  if (body.action === "link_class") {
    const classId = String(body.class_id ?? "").trim();
    if (!classId) return NextResponse.json({ error: "CLASS_REQUIRED" }, { status: 400 });
    const { error } = await db
      .from("school_classes")
      .update({ curriculum_id: id })
      .eq("id", classId)
      .eq("school_id", schoolId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "UNKNOWN_ACTION" }, { status: 400 });
}
