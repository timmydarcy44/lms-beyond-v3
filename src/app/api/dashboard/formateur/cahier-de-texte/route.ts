import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/session";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function resolveFormateurInstructors() {
  const session = await getSession();
  if (!session?.id) return { error: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  const supabase = await getServerClient();
  if (!supabase) return { error: NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 }) };
  const db = getServiceRoleClient() ?? supabase;

  const email = (session.email ?? "").trim().toLowerCase();
  let instructorQuery = db.from("school_instructors").select("id, school_id, profile_id");
  if (email) {
    instructorQuery = instructorQuery.or(
      `profile_id.eq.${session.id},id.eq.${session.id},email.ilike.${email}`,
    );
  } else {
    instructorQuery = instructorQuery.or(`profile_id.eq.${session.id},id.eq.${session.id}`);
  }
  const { data: instructorRows } = await instructorQuery;
  const instructors = instructorRows ?? [];
  return { session, db, instructors };
}

export async function GET(req: Request) {
  const ctx = await resolveFormateurInstructors();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { session, db, instructors } = ctx as {
    session: { id: string };
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
    instructors: Array<{ id: string; school_id: string }>;
  };

  const instructorIds = instructors.map((i) => i.id);
  if (!instructorIds.length) {
    return NextResponse.json({ sessions: [] });
  }

  const url = new URL(req.url);
  const slotId = url.searchParams.get("slotId");

  let query = db
    .from("school_planning_slots")
    .select(
      `
      id, starts_at, ends_at, duration_hours, status, class_id, module_id, instructor_id, school_id,
      lesson_content, lesson_objectives, lesson_homework, lesson_resources, lesson_completed_at,
      title, event_type, notes, description,
      module:school_planning_modules(id, name, code, curriculum_module_id, planned_hours_total),
      class:school_classes(id, name, curriculum_id)
    `,
    )
    .in("instructor_id", instructorIds)
    .neq("status", "cancelled")
    .order("starts_at", { ascending: false })
    .limit(120);

  if (slotId) query = query.eq("id", slotId);

  const { data: slots, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  // Enrichir avec objectifs du module cursus si dispo
  const curriculumModuleIds = [
    ...new Set(
      (slots ?? [])
        .map((s: { module?: { curriculum_module_id?: string } | null }) =>
          String(s.module?.curriculum_module_id ?? ""),
        )
        .filter(Boolean),
    ),
  ];
  const objectivesByModule = new Map<string, string>();
  if (curriculumModuleIds.length) {
    const { data: curMods } = await db
      .from("school_curriculum_modules")
      .select("id, learning_objectives, name, planned_hours_total")
      .in("id", curriculumModuleIds);
    for (const m of curMods ?? []) {
      objectivesByModule.set(String((m as { id: string }).id), String((m as { learning_objectives?: string }).learning_objectives ?? ""));
    }
  }

  const sessions = (slots ?? []).map((s: Record<string, unknown>) => {
    const mod = s.module as { curriculum_module_id?: string; name?: string } | null;
    const rawObjectives = objectivesByModule.get(String(mod?.curriculum_module_id ?? "")) ?? "";
    const moduleObjectives = rawObjectives
      .split("\n")
      .map((l) => l.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
    return {
      ...s,
      module_objectives: moduleObjectives,
      lesson_completed_at: s.lesson_completed_at ?? null,
    };
  });

  const { data: courseRows } = await db
    .from("courses")
    .select("id, title, status, updated_at")
    .or(`creator_id.eq.${session.id},owner_id.eq.${session.id}`)
    .order("updated_at", { ascending: false })
    .limit(80);

  const courseIds = (courseRows ?? []).map((row: { id?: string }) => String(row.id ?? "")).filter(Boolean);
  const journalsByCourse = new Map<string, { content: string; resources: unknown[] }>();
  if (courseIds.length) {
    const { data: journals } = await db
      .from("formateur_course_journals")
      .select("course_id, content, resources")
      .eq("author_id", session.id)
      .in("course_id", courseIds);
    for (const journal of journals ?? []) {
      const row = journal as { course_id?: string; content?: string; resources?: unknown };
      journalsByCourse.set(String(row.course_id ?? ""), {
        content: String(row.content ?? ""),
        resources: Array.isArray(row.resources) ? row.resources : [],
      });
    }
  }

  const courses = (courseRows ?? []).map((row: { id?: string; title?: string; status?: string }) => {
    const id = String(row.id ?? "");
    const journal = journalsByCourse.get(id);
    return {
      id,
      title: String(row.title ?? "Cours"),
      status: row.status ?? null,
      journal_content: journal?.content ?? "",
      journal_resources: journal?.resources ?? [],
    };
  });

  return NextResponse.json({ sessions, courses, profileId: session.id });
}

export async function POST(req: Request) {
  const ctx = await resolveFormateurInstructors();
  if ("error" in ctx && ctx.error) return ctx.error;
  const { session, db, instructors } = ctx as {
    session: { id: string };
    db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>;
    instructors: Array<{ id: string }>;
  };

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    return uploadJournalFile(req, session.id, db);
  }

  const instructorIds = new Set(instructors.map((i) => i.id));
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const slotId = String(body.slot_id ?? "").trim();
  const courseId = String(body.course_id ?? "").trim();
  if (!slotId && !courseId) return NextResponse.json({ error: "SLOT_REQUIRED" }, { status: 400 });

  if (courseId) {
    const { data: owned } = await db
      .from("courses")
      .select("id, creator_id, owner_id")
      .eq("id", courseId)
      .maybeSingle();
    const owner = owned as { creator_id?: string; owner_id?: string } | null;
    if (!owner) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    if (owner.creator_id !== session.id && owner.owner_id !== session.id) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }
    const resources = Array.isArray(body.lesson_resources) ? body.lesson_resources : [];
    const { error: journalError } = await db.from("formateur_course_journals").upsert(
      {
        course_id: courseId,
        author_id: session.id,
        content: body.lesson_content != null ? String(body.lesson_content) : "",
        resources,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "course_id,author_id" },
    );
    if (journalError && !slotId) {
      return NextResponse.json({ error: journalError.message }, { status: 400 });
    }
    if (!slotId) return NextResponse.json({ ok: true });
  }

  const { data: slot, error: slotErr } = await db
    .from("school_planning_slots")
    .select("id, instructor_id, status")
    .eq("id", slotId)
    .maybeSingle();
  if (slotErr) return NextResponse.json({ error: slotErr.message }, { status: 400 });
  if (!slot) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!instructorIds.has(String(slot.instructor_id ?? ""))) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const complete = body.complete !== false;
  const objectives = Array.isArray(body.lesson_objectives)
    ? body.lesson_objectives.map((o) => String(o).trim()).filter(Boolean)
    : typeof body.lesson_objectives === "string"
      ? String(body.lesson_objectives)
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
      : [];

  const resources = Array.isArray(body.lesson_resources) ? body.lesson_resources : [];

  const patch: Record<string, unknown> = {
    lesson_content: body.lesson_content != null ? String(body.lesson_content) : null,
    lesson_objectives: objectives,
    lesson_homework: body.lesson_homework != null ? String(body.lesson_homework) : null,
    lesson_resources: resources,
    updated_at: new Date().toISOString(),
  };

  if (complete) {
    patch.lesson_completed_at = new Date().toISOString();
    patch.lesson_completed_by = session.id;
    if (slot.status === "scheduled") {
      patch.status = "done";
    }
  }

  const { data, error } = await db
    .from("school_planning_slots")
    .update(patch)
    .eq("id", slotId)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ slot: data });
}

async function uploadJournalFile(
  req: Request,
  authorId: string,
  db: NonNullable<ReturnType<typeof getServiceRoleClient>> | Awaited<ReturnType<typeof getServerClient>>,
) {
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop lourd (20 Mo maximum)" }, { status: 400 });
  }
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80) || "document";
  const path = `cahier/${authorId}/${Date.now()}-${safeName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await db.storage.from("public").upload(path, buffer, {
    contentType: file.type || "application/octet-stream",
    upsert: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  const { data } = db.storage.from("public").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl, label: file.name });
}
