import { NextResponse } from "next/server";

import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { detectSlotConflicts, hoursBetween } from "@/lib/ecole/planning-utils";
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
  return { session, supabase, schoolId, db };
}

/** Contexte planning + créneaux (filtres query). */
export async function GET(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const url = new URL(req.url);
  const yearId = url.searchParams.get("yearId");
  const classId = url.searchParams.get("classId");
  const instructorId = url.searchParams.get("instructorId");
  const moduleId = url.searchParams.get("moduleId");
  const curriculumId = url.searchParams.get("curriculumId") || url.searchParams.get("cursus");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const [{ data: years }, { data: classes }, { data: modules }, { data: rooms }, instructorsRes, curriculaRes] =
    await Promise.all([
      db.from("school_years").select("*").eq("school_id", schoolId).order("label", { ascending: false }),
      db
        .from("school_classes")
        .select("id, name, promotion, school_year_id, student_count, curriculum_id")
        .eq("school_id", schoolId)
        .order("name"),
      db
        .from("school_planning_modules")
        .select("id, name, code, planned_hours_total, class_id, school_year_id, curriculum_module_id")
        .eq("school_id", schoolId)
        .order("name"),
      db.from("school_rooms").select("id, name").eq("school_id", schoolId).order("name"),
      db
        .from("school_instructors")
        .select(
          "id, first_name, last_name, email, expertise, teachable_subjects, availability, status, phone, photo_url",
        )
        .eq("school_id", schoolId)
        .eq("status", "active")
        .order("last_name", { ascending: true }),
      db
        .from("school_curricula")
        .select("id, name, code, total_hours, school_curriculum_modules(id, name, planned_hours_total, sort_order)")
        .eq("school_id", schoolId)
        .order("name"),
    ]);

  const instructorsRaw = instructorsRes.data ?? [];
  const instructorIds = instructorsRaw.map((i: { id: string }) => i.id);
  const hoursByInstructor = new Map<string, number>();
  if (instructorIds.length) {
    const { data: hourSlots } = await db
      .from("school_planning_slots")
      .select("instructor_id, duration_hours")
      .eq("school_id", schoolId)
      .in("instructor_id", instructorIds)
      .neq("status", "cancelled");
    for (const s of hourSlots ?? []) {
      const id = String((s as { instructor_id?: string }).instructor_id ?? "");
      if (!id) continue;
      hoursByInstructor.set(
        id,
        (hoursByInstructor.get(id) ?? 0) + Number((s as { duration_hours?: number }).duration_hours ?? 0),
      );
    }
  }
  const instructors = instructorsRaw.map((i: Record<string, unknown>) => ({
    ...i,
    full_name: `${String(i.first_name ?? "").trim()} ${String(i.last_name ?? "").trim()}`.trim(),
    hours_assigned: Math.round((hoursByInstructor.get(String(i.id)) ?? 0) * 100) / 100,
  }));

  let slotsQuery = db
    .from("school_planning_slots")
    .select(
      "id, school_year_id, class_id, module_id, instructor_id, room_id, starts_at, ends_at, duration_hours, status, notes, event_type, title, location_text, description, thematic, external_speaker, exam_kind, online_course_id, due_at",
    )
    .eq("school_id", schoolId)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: true });

  if (yearId) slotsQuery = slotsQuery.eq("school_year_id", yearId);
  if (classId) slotsQuery = slotsQuery.eq("class_id", classId);
  if (instructorId) slotsQuery = slotsQuery.eq("instructor_id", instructorId);
  if (moduleId) slotsQuery = slotsQuery.eq("module_id", moduleId);
  if (from) slotsQuery = slotsQuery.gte("starts_at", from);
  if (to) slotsQuery = slotsQuery.lte("starts_at", to);

  const { data: slots, error: slotsErr } = await slotsQuery;
  if (slotsErr) {
    return NextResponse.json({ error: slotsErr.message, code: slotsErr.code }, { status: 400 });
  }

  // Volumes planifiés par module (TOUS les créneaux, pas seulement la fenêtre affichée)
  const { data: allSlotsForVolumes } = await db
    .from("school_planning_slots")
    .select("module_id, duration_hours, lesson_completed_at")
    .eq("school_id", schoolId)
    .neq("status", "cancelled");
  const plannedByModule = new Map<string, number>();
  const deliveredByModule = new Map<string, number>();
  for (const s of allSlotsForVolumes ?? []) {
    const mid = String((s as { module_id?: string }).module_id ?? "");
    const h = Number((s as { duration_hours?: number }).duration_hours ?? 0);
    if (!mid) continue;
    plannedByModule.set(mid, (plannedByModule.get(mid) ?? 0) + h);
    if ((s as { lesson_completed_at?: string | null }).lesson_completed_at) {
      deliveredByModule.set(mid, (deliveredByModule.get(mid) ?? 0) + h);
    }
  }

  // Map curriculum_module → planning modules for cursus panel
  const curriculumModuleIds = [
    ...new Set(
      (modules ?? [])
        .map((m: { curriculum_module_id?: string | null }) => String(m.curriculum_module_id ?? ""))
        .filter(Boolean),
    ),
  ];
  const curriculumModuleToPlanning = new Map<string, string[]>();
  for (const m of modules ?? []) {
    const cm = String((m as { curriculum_module_id?: string | null }).curriculum_module_id ?? "");
    if (!cm) continue;
    const list = curriculumModuleToPlanning.get(cm) ?? [];
    list.push(String((m as { id: string }).id));
    curriculumModuleToPlanning.set(cm, list);
  }

  let filteredModules = modules ?? [];
  if (curriculumId) {
    const { data: curMods } = await db
      .from("school_curriculum_modules")
      .select("id")
      .eq("curriculum_id", curriculumId);
    const allowed = new Set((curMods ?? []).map((m: { id: string }) => m.id));
    filteredModules = (modules ?? []).filter((m: { curriculum_module_id?: string | null }) =>
      allowed.has(String(m.curriculum_module_id ?? "")),
    );
  }

  const modulesWithVolumes = filteredModules.map((m: Record<string, unknown>) => {
    const id = String(m.id);
    const total = Number(m.planned_hours_total ?? 0);
    const planned = Math.round((plannedByModule.get(id) ?? 0) * 100) / 100;
    const delivered = Math.round((deliveredByModule.get(id) ?? 0) * 100) / 100;
    return {
      ...m,
      hours_planned: planned,
      hours_delivered: delivered,
      hours_remaining: Math.round((total - planned) * 100) / 100,
    };
  });

  // Enrichir curricula avec volumes agrégés
  const curricula = (curriculaRes.data ?? []).map((c: Record<string, unknown>) => {
    const curMods =
      (c.school_curriculum_modules as Array<{ id: string; name: string; planned_hours_total?: number }>) ?? [];
    const mods = curMods.map((cm) => {
      const planningIds = curriculumModuleToPlanning.get(cm.id) ?? [];
      const planned = planningIds.reduce((a, pid) => a + (plannedByModule.get(pid) ?? 0), 0);
      const delivered = planningIds.reduce((a, pid) => a + (deliveredByModule.get(pid) ?? 0), 0);
      const total = Number(cm.planned_hours_total ?? 0);
      const planningModuleId = planningIds[0] ?? null;
      return {
        curriculum_module_id: cm.id,
        planning_module_id: planningModuleId,
        name: cm.name,
        planned_hours_total: total,
        hours_planned: Math.round(planned * 100) / 100,
        hours_delivered: Math.round(delivered * 100) / 100,
        hours_remaining: Math.round((total - planned) * 100) / 100,
      };
    });
    return {
      id: c.id,
      name: c.name,
      code: c.code,
      total_hours: c.total_hours,
      modules: mods,
    };
  });

  void curriculumModuleIds;

  return NextResponse.json({
    schoolId,
    years: years ?? [],
    classes: classes ?? [],
    modules: modulesWithVolumes,
    rooms: rooms ?? [],
    instructors,
    slots: slots ?? [],
    curricula,
    selectedCurriculumId: curriculumId || null,
  });
}

/** Création créneau (+ module / année si besoin). */
export async function POST(req: Request) {
  const ctx = await resolveSchoolClient();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { schoolId, db } = ctx as {
    schoolId: string;
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
  };

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "create_slot");

  if (action === "ensure_year") {
    const label = String(body.label ?? "2027-2028").trim();
    const { data, error } = await db
      .from("school_years")
      .upsert(
        {
          school_id: schoolId,
          label,
          is_current: Boolean(body.is_current ?? true),
          starts_on: body.starts_on ?? null,
          ends_on: body.ends_on ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "school_id,label" },
      )
      .select("*")
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ year: data });
  }

  if (action === "create_module") {
    const name = String(body.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    const { data, error } = await db
      .from("school_planning_modules")
      .insert({
        school_id: schoolId,
        school_year_id: body.school_year_id ?? null,
        class_id: body.class_id ?? null,
        name,
        code: body.code ?? null,
        planned_hours_total: Number(body.planned_hours_total ?? 0),
      })
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ module: data });
  }

  const eventType = String(body.event_type ?? "course").trim() || "course";
  const allowedTypes = ["course", "outing", "masterclass", "elearning", "exam"];
  if (!allowedTypes.includes(eventType)) {
    return NextResponse.json({ error: "INVALID_EVENT_TYPE" }, { status: 400 });
  }

  const classId = String(body.class_id ?? "").trim();
  const moduleId = body.module_id ? String(body.module_id).trim() : "";
  const startsAt = String(body.starts_at ?? "").trim();
  const endsAt = String(body.ends_at ?? "").trim();
  if (!classId || !startsAt || !endsAt) {
    return NextResponse.json({ error: "MISSING_FIELDS" }, { status: 400 });
  }
  if (eventType === "course" && !moduleId) {
    return NextResponse.json({ error: "MODULE_REQUIRED" }, { status: 400 });
  }

  const duration = hoursBetween(startsAt, endsAt);
  if (duration <= 0) return NextResponse.json({ error: "INVALID_RANGE" }, { status: 400 });

  const instructorId = body.instructor_id ? String(body.instructor_id) : null;
  const roomId = body.room_id ? String(body.room_id) : null;
  const yearId = body.school_year_id ? String(body.school_year_id) : null;

  const { data: existing } = await db
    .from("school_planning_slots")
    .select("id, instructor_id, class_id, room_id, module_id, starts_at, ends_at, duration_hours, status")
    .eq("school_id", schoolId)
    .neq("status", "cancelled");

  let moduleTotalHours = 0;
  let plannedExcluding = 0;
  if (moduleId) {
    const { data: moduleRow } = await db
      .from("school_planning_modules")
      .select("id, planned_hours_total, name")
      .eq("id", moduleId)
      .eq("school_id", schoolId)
      .maybeSingle();
    moduleTotalHours = Number((moduleRow as { planned_hours_total?: number } | null)?.planned_hours_total ?? 0);
    plannedExcluding = (existing ?? [])
      .filter((s: { module_id?: string; status?: string }) => s.module_id === moduleId && s.status !== "cancelled")
      .reduce((acc: number, s: { duration_hours?: number }) => acc + Number(s.duration_hours ?? 0), 0);
  }

  let instructorName: string | null = null;
  if (instructorId) {
    const { data: p } = await db
      .from("school_instructors")
      .select("first_name, last_name, email")
      .eq("id", instructorId)
      .eq("school_id", schoolId)
      .maybeSingle();
    instructorName =
      `${String((p as { first_name?: string } | null)?.first_name ?? "").trim()} ${String((p as { last_name?: string } | null)?.last_name ?? "").trim()}`.trim() ||
      String((p as { email?: string } | null)?.email ?? "") ||
      null;
  }

  const conflicts = detectSlotConflicts({
    candidate: {
      class_id: classId,
      module_id: moduleId || "none",
      instructor_id: instructorId,
      room_id: roomId,
      starts_at: startsAt,
      ends_at: endsAt,
      duration_hours: duration,
    },
    existing: (existing ?? []) as Array<{
      id: string;
      instructor_id?: string | null;
      class_id: string;
      room_id?: string | null;
      module_id: string;
      starts_at: string;
      ends_at: string;
      duration_hours: number;
      status?: string;
    }>,
    instructorName,
    moduleTotalHours,
    modulePlannedHoursExcludingCandidate: plannedExcluding,
  });

  if (conflicts.length > 0 && !body.force) {
    return NextResponse.json({ error: "CONFLICT", conflicts }, { status: 409 });
  }

  const { data: slot, error } = await db
    .from("school_planning_slots")
    .insert({
      school_id: schoolId,
      school_year_id: yearId,
      class_id: classId,
      module_id: moduleId || null,
      instructor_id: instructorId,
      room_id: roomId,
      starts_at: startsAt,
      ends_at: endsAt,
      duration_hours: duration,
      status: "scheduled",
      event_type: eventType,
      title: body.title ? String(body.title) : null,
      location_text: body.location_text ? String(body.location_text) : null,
      description: body.description ? String(body.description) : null,
      online_course_id: body.online_course_id ? String(body.online_course_id) : null,
      exam_kind: body.exam_kind ? String(body.exam_kind) : null,
      thematic: body.thematic ? String(body.thematic) : null,
      external_speaker: body.external_speaker ? String(body.external_speaker) : null,
      due_at: body.due_at ? String(body.due_at) : null,
      notes: body.notes ? String(body.notes) : null,
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ slot, conflictsIgnored: conflicts.length > 0 });
}
