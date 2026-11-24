import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { resolveEffectiveApprenantUserId } from "@/lib/control/learner-preview";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import {
  buildUserObjectiveDisplay,
  migrateLegacyProjectToV2,
} from "@/lib/particulier/edge-professional-project-v2";
import { parseProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { metricsFromLegacySessionRows, formatDurationCompact } from "@/lib/lms/lms-metrics";
import { readCourseLearnerProgress } from "@/lib/courses/course-completion";

export const dynamic = "force-dynamic";

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { userId, preview } = await resolveEffectiveApprenantUserId(session.id);
  let formations: Array<{
    id: string;
    title: string;
    href: string;
    progress: number | null;
    meta: string | null;
    level: string | null;
  }> = [];

  try {
    // Toujours charger pour userId effectif (preview Anaïs ≠ session staff).
    // Schéma enrollments prod : pas de colonne `id` → ne pas la sélectionner.
    const { data: enrollments, error: enrErr } = await db
      .from("enrollments")
      .select("course_id, courses ( id, title, slug )")
      .eq("user_id", userId)
      .limit(40);
    if (enrErr) {
      console.warn("[parcours-v2] enrollments", enrErr.message);
    }
    for (const enr of enrollments ?? []) {
      const courseId = String((enr as { course_id?: string }).course_id ?? "");
      if (!courseId) continue;
      const courseRaw = (enr as { courses?: { title?: string; slug?: string } | Array<{ title?: string; slug?: string }> | null }).courses;
      const course = Array.isArray(courseRaw) ? courseRaw[0] : courseRaw;
      const slug = course?.slug?.trim() || courseId;
      formations.push({
        id: courseId,
        title: course?.title?.trim() || "Formation",
        href: `/catalog/formations/${slug}`,
        progress: null,
        meta: null,
        level: null,
      });
    }

    // catalog_access (achat / grant BtoC)
    const accessRes = await db
      .from("catalog_access")
      .select("catalog_item_id, catalog_items ( id, title, content_id )")
      .eq("user_id", userId)
      .in("access_status", ["purchased", "manually_granted"])
      .limit(40);
    const accessRows = accessRes.error ? [] : accessRes.data;
    const knownIds = new Set(formations.map((f) => f.id));
    const knownTitles = new Set(formations.map((f) => f.title.trim().toLowerCase()));
    for (const row of accessRows ?? []) {
      const itemRaw = (row as { catalog_items?: Record<string, unknown> | Record<string, unknown>[] | null }).catalog_items;
      const item = Array.isArray(itemRaw) ? itemRaw[0] : itemRaw;
      const contentId = item?.content_id ? String(item.content_id) : "";
      const title = String(item?.title ?? "").trim() || "Formation";
      const id = contentId || String(item?.id ?? "");
      if (!id || knownIds.has(id) || knownTitles.has(title.toLowerCase())) continue;
      formations.push({
        id,
        title,
        href: `/catalog/formations/${contentId || id}`,
        progress: null,
        meta: "Assignée",
        level: null,
      });
      knownIds.add(id);
      knownTitles.add(title.toLowerCase());
    }

    const { data: parts } = await db
      .from("formation_participants")
      .select("dossier_id")
      .eq("profile_id", userId)
      .limit(20);
    const dossierIds = (parts ?? [])
      .map((p) => String((p as { dossier_id?: string }).dossier_id ?? ""))
      .filter(Boolean);
    if (dossierIds.length) {
      const { data: dossiers } = await db
        .from("formation_dossiers")
        .select("id, course_title, training_course_id")
        .in("id", dossierIds);
      for (const d of dossiers ?? []) {
        const title = String((d as { course_title?: string }).course_title ?? "").trim() || "Formation";
        if (knownTitles.has(title.toLowerCase())) continue;
        const trainingCourseId = String(
          (d as { training_course_id?: string | null }).training_course_id ?? "",
        );
        let lmsCourseId: string | null = null;
        let slug: string | null = null;
        if (trainingCourseId) {
          const { data: tc } = await db
            .from("training_courses")
            .select("lms_course_id, title")
            .eq("id", trainingCourseId)
            .maybeSingle();
          lmsCourseId = tc?.lms_course_id ? String(tc.lms_course_id) : null;
          // Secours : rattacher un parcours LMS au titre si le lien manque
          if (!lmsCourseId) {
            const needle = String(tc?.title || title)
              .toLowerCase()
              .replace(/^les\s+/, "")
              .trim();
            const { data: matched } = await db
              .from("courses")
              .select("id, slug, title")
              .ilike("title", `%${needle.slice(0, 48)}%`)
              .limit(5);
            const best =
              (matched ?? []).find((c) =>
                String(c.title ?? "")
                  .toLowerCase()
                  .includes("neuro"),
              ) || (matched ?? [])[0];
            if (best?.id) {
              lmsCourseId = String(best.id);
              slug = best.slug ? String(best.slug) : lmsCourseId;
              // Persiste le lien pour les prochaines fois (best-effort)
              void db
                .from("training_courses")
                .update({ lms_course_id: lmsCourseId })
                .eq("id", trainingCourseId)
                .then(() => undefined)
                .catch(() => undefined);
            }
          } else {
            const { data: course } = await db
              .from("courses")
              .select("id, slug")
              .eq("id", lmsCourseId)
              .maybeSingle();
            slug = course?.slug ? String(course.slug) : lmsCourseId;
          }
        }
        // UUID LMS seulement dans `id` (évite crash open_badges / progress)
        const formationId = lmsCourseId || `dossier-${(d as { id: string }).id}`;
        formations.push({
          id: formationId,
          title,
          href: slug
            ? `/catalog/formations/${slug}`
            : "/dashboard/apprenant/formations",
          progress: null,
          meta: lmsCourseId ? "Assignée" : "Assignée · parcours LMS à lier",
          level: null,
        });
        knownIds.add(formationId);
        knownTitles.add(title.toLowerCase());

        // Crée l’enrollment manquant si on a résolu un LMS
        if (lmsCourseId && !knownIds.has(`enroll:${lmsCourseId}`)) {
          const { data: existing } = await db
            .from("enrollments")
            .select("course_id")
            .eq("user_id", userId)
            .eq("course_id", lmsCourseId)
            .maybeSingle();
          if (!existing) {
            await db.from("enrollments").insert({
              user_id: userId,
              course_id: lmsCourseId,
              role: "learner",
            });
          }
          knownIds.add(`enroll:${lmsCourseId}`);
        }
      }
    }

    // Fallback non-preview : catalogue org via getApprenantDashboardData si rien trouvé.
    if (!formations.length && !preview) {
      const data = await getApprenantDashboardData();
      formations = (data.formations ?? []).map((f) => ({
        id: f.id,
        title: f.title,
        href: f.href,
        progress: f.progress ?? null,
        meta: f.level || f.meta || null,
        level: f.level ?? null,
      }));
    }
  } catch (e) {
    console.error("[parcours-v2] formations", e);
    formations = [];
  }

  const { data: profile } = await db
    .from("profiles")
    .select("target_career_slug, professional_project, career_goal, career_goal_other")
    .eq("id", userId)
    .maybeSingle();

  const row = (profile ?? {}) as Record<string, unknown>;
  const project = migrateLegacyProjectToV2(parseProfessionalProject(row.professional_project));
  const objectiveTitle =
    buildUserObjectiveDisplay(project)?.trim() ||
    String(row.target_career_slug ?? "").replace(/-/g, " ") ||
    null;

  const isUuid = (v: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

  const courseIds = formations.map((f) => f.id).filter((id) => isUuid(id));
  const progressByCourse = new Map<
    string,
    Awaited<ReturnType<typeof readCourseLearnerProgress>>
  >();
  await Promise.all(
    courseIds.map(async (id) => {
      try {
        progressByCourse.set(id, await readCourseLearnerProgress(userId, id));
      } catch {
        progressByCourse.set(id, {
          complete: false,
          percent: 0,
          doneChapters: 0,
          totalChapters: 0,
        });
      }
    }),
  );

  const badgeByCourse = new Map<string, string>();
  if (courseIds.length) {
    const { data: openBadges, error: badgeErr } = await db
      .from("open_badges")
      .select("course_id, name, title")
      .in("course_id", courseIds);
    if (badgeErr) console.warn("[parcours-v2] open_badges", badgeErr.message);
    for (const b of openBadges ?? []) {
      const cid = String((b as { course_id?: string }).course_id ?? "");
      if (!cid || badgeByCourse.has(cid)) continue;
      const name =
        String((b as { name?: string }).name ?? "").trim() ||
        String((b as { title?: string }).title ?? "").trim();
      if (name) badgeByCourse.set(cid, name);
    }
  }

  const modules = formations.map((f) => {
    const completion = progressByCourse.get(f.id);
    const total = completion?.totalChapters ?? 0;
    const done = completion?.doneChapters ?? 0;
    const pct =
      completion && completion.totalChapters > 0
        ? completion.percent
        : Math.max(0, Math.min(100, Number(f.progress ?? 0)));
    let status: "done" | "current" | "upcoming" = "upcoming";
    if (completion?.complete || pct >= 100) status = "done";
    else if (pct > 0 || done > 0) status = "current";
    return {
      id: f.id,
      title: f.title,
      href: f.href,
      status,
      done,
      total,
      meta: f.meta || f.level || null,
      badgeHint: badgeByCourse.get(f.id) ?? null,
    };
  });

  let currentSet = false;
  for (const m of modules) {
    if (m.status === "done") continue;
    if (!currentSet) {
      m.status = "current";
      currentSet = true;
    } else if (m.status === "current") {
      m.status = "upcoming";
    }
  }

  const resume = modules.find((m) => m.status === "current") ?? modules[0] ?? null;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const { data: sessions } = await db
    .from("learning_sessions")
    .select("started_at, ended_at, duration_seconds, duration_active_seconds")
    .eq("user_id", userId)
    .gte("started_at", weekStart.toISOString())
    .lt("started_at", weekEnd.toISOString());

  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const buckets = days.map((label, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    return { label, key, seconds: 0 };
  });

  for (const s of sessions ?? []) {
    const started = String((s as { started_at?: string }).started_at ?? "");
    const key = dayKey(started);
    const bucket = buckets.find((b) => b.key === key);
    if (!bucket) continue;
    const active = Number((s as { duration_active_seconds?: number }).duration_active_seconds ?? 0);
    const duration = Number((s as { duration_seconds?: number }).duration_seconds ?? 0);
    bucket.seconds += active > 0 ? active : duration;
  }

  const metrics = metricsFromLegacySessionRows(
    (sessions ?? []).map((s) => ({
      started_at: (s as { started_at?: string }).started_at ?? null,
      ended_at: (s as { ended_at?: string }).ended_at ?? null,
      duration_seconds: (s as { duration_seconds?: number }).duration_seconds ?? null,
      duration_active_seconds:
        (s as { duration_active_seconds?: number }).duration_active_seconds ?? null,
    })),
  );

  const maxSec = Math.max(1, ...buckets.map((b) => b.seconds));

  return NextResponse.json({
    objectiveTitle,
    resume: resume
      ? {
          title: resume.title,
          href: resume.href,
          moduleIndex: modules.findIndex((m) => m.id === resume.id) + 1,
          done: resume.done,
          total: resume.total,
          minutesLeft: null as number | null,
        }
      : null,
    modules,
    week: {
      totalLabel: formatDurationCompact(
        metrics.connectedSeconds || buckets.reduce((a, b) => a + b.seconds, 0),
      ),
      bars: buckets.map((b) => ({
        label: b.label,
        ratio: b.seconds / maxSec,
        seconds: b.seconds,
      })),
    },
    expertHref: "/dashboard/apprenant/mon-projet-expert",
  });
}
