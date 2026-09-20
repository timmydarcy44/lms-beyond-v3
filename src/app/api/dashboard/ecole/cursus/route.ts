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

export async function GET() {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const { data: curricula, error } = await db
    .from("school_curricula")
    .select("*, school_years(id, label), school_curriculum_modules(id, name, planned_hours_total, sort_order)")
    .eq("school_id", schoolId)
    .order("name");

  if (error) {
    const simple = await db.from("school_curricula").select("*").eq("school_id", schoolId).order("name");
    return NextResponse.json({ curricula: simple.data ?? [], warning: error.message });
  }

  const enriched = await Promise.all(
    (curricula ?? []).map(async (c: Record<string, unknown>) => {
      const modules = (c.school_curriculum_modules as Array<{ id: string; planned_hours_total?: number }>) ?? [];
      const moduleIds = modules.map((m) => m.id);
      let hoursPlanned = 0;
      if (moduleIds.length) {
        const { data: planningMods } = await db
          .from("school_planning_modules")
          .select("id, curriculum_module_id")
          .eq("school_id", schoolId)
          .in("curriculum_module_id", moduleIds);
        const planningIds = (planningMods ?? []).map((p: { id: string }) => p.id);
        if (planningIds.length) {
          const { data: slots } = await db
            .from("school_planning_slots")
            .select("duration_hours, module_id")
            .eq("school_id", schoolId)
            .in("module_id", planningIds)
            .neq("status", "cancelled");
          hoursPlanned = (slots ?? []).reduce(
            (a: number, s: { duration_hours?: number }) => a + Number(s.duration_hours ?? 0),
            0,
          );
        }
      }
      const total = Number(c.total_hours ?? 0) || modules.reduce((a, m) => a + Number(m.planned_hours_total ?? 0), 0);
      return {
        ...c,
        hours_planned: Math.round(hoursPlanned * 100) / 100,
        hours_remaining: Math.round((total - hoursPlanned) * 100) / 100,
        modules_count: modules.length,
      };
    }),
  );

  return NextResponse.json({ curricula: enriched });
}

export async function POST(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });

  const modules = Array.isArray(body.modules) ? body.modules : [];

  const { data: curriculum, error } = await db
    .from("school_curricula")
    .insert({
      school_id: schoolId,
      school_year_id: body.school_year_id ? String(body.school_year_id) : null,
      name,
      code: body.code ? String(body.code).trim() : null,
      description: body.description ? String(body.description) : null,
      starts_on: body.starts_on || null,
      ends_on: body.ends_on || null,
      total_hours: Number(body.total_hours ?? 0),
      status: "active",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  if (modules.length) {
    const rows = modules
      .map((m: Record<string, unknown>, idx: number) => ({
        curriculum_id: curriculum.id,
        school_id: schoolId,
        name: String(m.name ?? "").trim(),
        code: m.code ? String(m.code) : null,
        description: m.description ? String(m.description) : null,
        learning_objectives: m.learning_objectives ? String(m.learning_objectives) : null,
        planned_hours_total: Number(m.planned_hours_total ?? 0),
        sort_order: Number(m.sort_order ?? idx),
        online_course_id: m.online_course_id ? String(m.online_course_id) : null,
      }))
      .filter((r: { name: string }) => r.name);

    if (rows.length) {
      const { data: inserted } = await db.from("school_curriculum_modules").insert(rows).select("id, name, code, planned_hours_total");
      const sum = rows.reduce((a: number, r: { planned_hours_total: number }) => a + r.planned_hours_total, 0);
      await db.from("school_curricula").update({ total_hours: sum }).eq("id", curriculum.id);

      // Miroir planning pour chaque module
      for (const mod of inserted ?? []) {
        await db.from("school_planning_modules").insert({
          school_id: schoolId,
          name: mod.name,
          code: mod.code ?? null,
          planned_hours_total: Number(mod.planned_hours_total ?? 0),
          curriculum_module_id: mod.id,
        });
      }
    }
  }

  return NextResponse.json({ curriculum });
}
