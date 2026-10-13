import { NextResponse } from "next/server";

import { ensureWebsiteCursus } from "@/lib/cfa/website-cursus";
import { resolveSchoolIdForEcoleDashboard } from "@/lib/auth/school-access";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Db = NonNullable<ReturnType<typeof getServiceRoleClient>>;

async function authorize() {
  if (!(await isSuperAdmin())) {
    return { error: NextResponse.json({ error: "Accès refusé" }, { status: 403 }) };
  }
  const session = await getSession();
  const supabase = await getServerClient();
  const db = getServiceRoleClient();
  if (!session?.id || !supabase || !db) {
    return { error: NextResponse.json({ error: "Service indisponible" }, { status: 503 }) };
  }
  const schoolId = await resolveSchoolIdForEcoleDashboard(session.id, session.email, supabase);
  if (!schoolId) {
    return { error: NextResponse.json({ error: "Aucune école n'est rattachée à ce compte." }, { status: 400 }) };
  }
  return { db, schoolId };
}

function courseIdsFromPath(snapshot: unknown): string[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const snap = snapshot as { steps?: unknown[]; selectedCourses?: unknown[] };
  const fromSteps = Array.isArray(snap.steps)
    ? snap.steps.flatMap((step) => {
        if (!step || typeof step !== "object") return [];
        const row = step as { content_kind?: string; content_id?: string | null };
        return row.content_kind === "course" && row.content_id ? [String(row.content_id)] : [];
      })
    : [];
  const selected = Array.isArray(snap.selectedCourses) ? snap.selectedCourses.map((id) => String(id)) : [];
  return [...new Set([...fromSteps, ...selected].filter(Boolean))];
}

function personName(row: { full_name?: string | null; first_name?: string | null; last_name?: string | null; email?: string | null }) {
  const full = String(row.full_name ?? "").trim();
  if (full) return full;
  const parts = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim();
  return parts || String(row.email ?? "Apprenant");
}

export async function GET() {
  const ctx = await authorize();
  if ("error" in ctx) return ctx.error;
  const { db, schoolId } = ctx;
  await ensureWebsiteCursus(db, schoolId);

  const [{ data: curricula }, { data: modules }, { data: classes }, { data: courses }, { data: applications }] =
    await Promise.all([
      db.from("school_curricula").select("id, name, code, description, total_hours, status").eq("school_id", schoolId).order("name"),
      db.from("school_curriculum_modules").select("id, curriculum_id, name, online_course_id, planned_hours_total").eq("school_id", schoolId).order("sort_order"),
      db.from("school_classes").select("id, name, curriculum_id").eq("school_id", schoolId),
      db.from("courses").select("id, title, slug, status, cover_image, builder_snapshot").order("updated_at", { ascending: false }).limit(400),
      db.from("cfa_applications").select("id, first_name, last_name, email, status, specialization").order("updated_at", { ascending: false }).limit(300),
    ]);

  const classIds = (classes ?? []).map((row) => row.id);
  const enrollments = classIds.length
    ? (await db.from("class_enrollments").select("class_id, student_id").in("class_id", classIds)).data ?? []
    : [];
  const studentIds = [...new Set(enrollments.map((row) => row.student_id))];
  const profiles = studentIds.length
    ? (await db.from("profiles").select("id, email, full_name, first_name, last_name").in("id", studentIds)).data ?? []
    : [];
  const profileById = new Map(profiles.map((row) => [row.id, row]));

  const byoundCourses = (courses ?? [])
    .filter((course) => {
      const snap = course.builder_snapshot as { general?: { publisher?: string } } | null;
      return snap?.general?.publisher === "byound";
    })
    .map((course) => {
      const general = (course.builder_snapshot as { general?: { title?: string } } | null)?.general;
      return { id: course.id, title: general?.title?.trim() || course.title || "Sans titre" };
    });
  const courseTitle = new Map(byoundCourses.map((course) => [course.id, course.title]));
  const pathResult = await db.from("paths").select("id, title, path_snapshot").limit(200);
  const paths = pathResult.error
    ? []
    : (pathResult.data ?? [])
        .filter((path) => (path.path_snapshot as { publisher?: string } | null)?.publisher === "byound")
        .map((path) => {
          const snap = path.path_snapshot as { title?: string } | null;
          return {
            id: path.id,
            title: snap?.title?.trim() || path.title || "Sans titre",
            courseCount: courseIdsFromPath(path.path_snapshot).length,
          };
        });

  const payload = (curricula ?? []).map((curriculum) => {
    const curriculumClasses = (classes ?? []).filter((row) => row.curriculum_id === curriculum.id);
    const classIdSet = new Set(curriculumClasses.map((row) => row.id));
    const learners = enrollments
      .filter((row) => classIdSet.has(row.class_id))
      .map((row) => {
        const profile = profileById.get(row.student_id);
        return {
          id: row.student_id,
          email: profile?.email ?? "",
          name: profile ? personName(profile) : "Apprenant",
        };
      });
    const uniqueLearners = [...new Map(learners.map((learner) => [learner.id, learner])).values()];
    return {
      ...curriculum,
      modules: (modules ?? [])
        .filter((row) => row.curriculum_id === curriculum.id)
        .map((row) => ({
          id: row.id,
          name: row.name,
          onlineCourseId: row.online_course_id,
          courseTitle: row.online_course_id ? courseTitle.get(row.online_course_id) ?? row.name : null,
        })),
      learners: uniqueLearners,
    };
  });

  return NextResponse.json({
    curricula: payload,
    courses: byoundCourses,
    paths,
    candidates: (applications ?? []).map((row) => ({
      id: row.id,
      name: `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || row.email,
      email: row.email,
      status: row.status,
      specialization: row.specialization,
    })),
  });
}

async function ensureClass(db: Db, schoolId: string, curriculumId: string, name: string) {
  const { data: existing } = await db
    .from("school_classes")
    .select("id")
    .eq("school_id", schoolId)
    .eq("curriculum_id", curriculumId)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id as string;
  const { data: created, error } = await db
    .from("school_classes")
    .insert({ school_id: schoolId, name, curriculum_id: curriculumId })
    .select("id")
    .single();
  if (error || !created) throw new Error(error?.message || "Classe introuvable");
  return created.id as string;
}

async function enrollInCourses(db: Db, userId: string, courseIds: string[]) {
  const unique = [...new Set(courseIds.filter(Boolean))];
  if (!unique.length) return;
  const rows = unique.map((courseId) => ({ user_id: userId, course_id: courseId }));
  const primary = await db.from("enrollments").upsert(rows, { onConflict: "user_id,course_id" });
  if (!primary.error) return;
  await db.from("course_enrollments").upsert(rows, { onConflict: "user_id,course_id" });
}

export async function POST(request: Request) {
  const ctx = await authorize();
  if ("error" in ctx) return ctx.error;
  const { db, schoolId } = ctx;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = String(body?.action ?? "");

  if (action === "create") {
    const name = String(body?.name ?? "").trim();
    if (!name) return NextResponse.json({ error: "Le nom du cursus est requis." }, { status: 400 });
    const { data, error } = await db
      .from("school_curricula")
      .insert({
        school_id: schoolId,
        name,
        code: String(body?.code ?? "").trim() || null,
        description: String(body?.description ?? "").trim() || null,
        status: "active",
      })
      .select("id")
      .single();
    if (error || !data) return NextResponse.json({ error: error?.message || "Création impossible" }, { status: 400 });
    await ensureClass(db, schoolId, data.id, name);
    return NextResponse.json({ id: data.id });
  }

  if (action === "attach_course") {
    const curriculumId = String(body?.curriculumId ?? "");
    const courseId = String(body?.courseId ?? "");
    if (!curriculumId || !courseId) return NextResponse.json({ error: "Cursus ou formation manquant." }, { status: 400 });
    const { data: course } = await db.from("courses").select("id, title, builder_snapshot").eq("id", courseId).maybeSingle();
    if (!course) return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    const general = (course.builder_snapshot as { general?: { title?: string } } | null)?.general;
    const title = general?.title?.trim() || course.title || "Formation";
    const { data: already } = await db
      .from("school_curriculum_modules")
      .select("id")
      .eq("curriculum_id", curriculumId)
      .eq("online_course_id", courseId)
      .maybeSingle();
    if (!already) {
      const { error } = await db.from("school_curriculum_modules").insert({
        curriculum_id: curriculumId,
        school_id: schoolId,
        name: title,
        online_course_id: courseId,
        planned_hours_total: 0,
        sort_order: 0,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  }

  if (action === "attach_path") {
    const curriculumId = String(body?.curriculumId ?? "");
    const pathId = String(body?.pathId ?? "");
    if (!curriculumId || !pathId) return NextResponse.json({ error: "Cursus ou parcours manquant." }, { status: 400 });
    const { data: path } = await db.from("paths").select("id, title, path_snapshot").eq("id", pathId).maybeSingle();
    if (!path) return NextResponse.json({ error: "Parcours introuvable" }, { status: 404 });
    const courseIds = courseIdsFromPath(path.path_snapshot);
    if (!courseIds.length) {
      return NextResponse.json({ error: "Ce parcours ne contient aucune formation." }, { status: 400 });
    }
    const { data: linkedCourses } = await db.from("courses").select("id, title, builder_snapshot").in("id", courseIds);
    const courseById = new Map((linkedCourses ?? []).map((course) => [course.id, course]));
    const { data: existing } = await db
      .from("school_curriculum_modules")
      .select("online_course_id, sort_order")
      .eq("curriculum_id", curriculumId);
    const have = new Set((existing ?? []).map((row) => row.online_course_id).filter(Boolean));
    let sortOrder = (existing ?? []).reduce((max, row) => Math.max(max, Number(row.sort_order) || 0), 0);
    let added = 0;
    for (const courseId of courseIds) {
      if (have.has(courseId)) continue;
      const course = courseById.get(courseId);
      if (!course) continue;
      const general = (course.builder_snapshot as { general?: { title?: string } } | null)?.general;
      const title = general?.title?.trim() || course.title || "Formation";
      sortOrder += 1;
      const { error } = await db.from("school_curriculum_modules").insert({
        curriculum_id: curriculumId,
        school_id: schoolId,
        name: title,
        online_course_id: courseId,
        planned_hours_total: 0,
        sort_order: sortOrder,
      });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      added += 1;
    }

    const { data: classes } = await db.from("school_classes").select("id").eq("school_id", schoolId).eq("curriculum_id", curriculumId);
    const classIds = (classes ?? []).map((row) => row.id);
    if (classIds.length) {
      const { data: classRows } = await db.from("class_enrollments").select("student_id").in("class_id", classIds);
      const studentIds = [...new Set((classRows ?? []).map((row) => row.student_id))];
      for (const studentId of studentIds) {
        await enrollInCourses(db, studentId, courseIds);
      }
    }

    const snap = path.path_snapshot as { title?: string } | null;
    return NextResponse.json({
      ok: true,
      added,
      total: courseIds.length,
      pathTitle: snap?.title?.trim() || path.title || "Parcours",
    });
  }

  if (action === "assign_learner") {
    const email = String(body?.email ?? "").trim().toLowerCase();
    const curriculumId = String(body?.curriculumId ?? "");
    const courseId = String(body?.courseId ?? "");
    if (!email.includes("@")) return NextResponse.json({ error: "Email requis." }, { status: 400 });
    const { data: profile } = await db
      .from("profiles")
      .select("id, email, full_name, first_name, last_name")
      .ilike("email", email)
      .maybeSingle();
    if (!profile?.id) {
      return NextResponse.json(
        { error: "Cet email n'a pas encore de compte. La personne doit se connecter une première fois." },
        { status: 404 },
      );
    }

    const courseIds = courseId ? [courseId] : [];
    if (curriculumId) {
      const { data: curriculum } = await db.from("school_curricula").select("id, name").eq("id", curriculumId).maybeSingle();
      if (!curriculum) return NextResponse.json({ error: "Cursus introuvable" }, { status: 404 });
      const classId = await ensureClass(db, schoolId, curriculumId, curriculum.name);
      const enrolled = await db.from("class_enrollments").insert({ class_id: classId, student_id: profile.id });
      if (enrolled.error && enrolled.error.code !== "23505") {
        return NextResponse.json({ error: enrolled.error.message }, { status: 400 });
      }
      await db.from("school_students").insert({ school_id: schoolId, student_id: profile.id });
      const { data: linked } = await db
        .from("school_curriculum_modules")
        .select("online_course_id")
        .eq("curriculum_id", curriculumId);
      for (const row of linked ?? []) {
        if (row.online_course_id) courseIds.push(row.online_course_id);
      }
    }

    await enrollInCourses(db, profile.id, courseIds);
    return NextResponse.json({ ok: true, name: personName(profile) });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
