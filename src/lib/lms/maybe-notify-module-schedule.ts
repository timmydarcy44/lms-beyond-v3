import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { buildModuleScheduleEmail } from "@/lib/email/module-schedule-notice";
import { isCourseNodeVisible } from "@/lib/courses/visible-structure";
import {
  moduleFinishedAt,
  readModuleOpenRule,
  scheduleOpenAtForModule,
  type ScheduleModule,
} from "@/lib/lms/module-open";

type BuilderSection = {
  id?: string;
  title?: string;
  deleted_at?: string | null;
  open_rule?: unknown;
  chapters?: Array<{
    id?: string;
    title?: string;
    deleted_at?: string | null;
    subchapters?: Array<{ id?: string; deleted_at?: string | null }>;
  }>;
};

function parseSnapshot(raw: unknown): { sections: BuilderSection[] } | null {
  if (raw == null) return null;
  try {
    const snap = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!snap || typeof snap !== "object") return null;
    const sections = (snap as { sections?: unknown }).sections;
    return Array.isArray(sections) ? { sections: sections as BuilderSection[] } : null;
  } catch {
    return null;
  }
}

/**
 * Après une complétion de feuille : si un module vient d’être terminé et que le suivant
 * s’ouvre avec délai, envoie un e-mail « prochain module le … » (une fois).
 */
export async function maybeNotifyModuleScheduleAfterLeaf(params: {
  db: SupabaseClient;
  userId: string;
  courseId: string;
  leafId: string;
}): Promise<void> {
  const { db, userId, courseId, leafId } = params;

  const { data: course } = await db
    .from("courses")
    .select("id, title, slug, builder_snapshot")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) return;

  const snap = parseSnapshot((course as { builder_snapshot?: unknown }).builder_snapshot);
  if (!snap?.sections?.length) return;

  const visibleSections = snap.sections.filter((section) => isCourseNodeVisible(section));
  const openModules: ScheduleModule[] = visibleSections.map((section) => ({
    openRule: readModuleOpenRule(section.open_rule),
    lessons: (section.chapters ?? [])
      .filter((chapter) => isCourseNodeVisible(chapter))
      .flatMap((chapter) => [
        { id: String(chapter.id ?? "") },
        ...(chapter.subchapters ?? [])
          .filter((sub) => isCourseNodeVisible(sub))
          .map((sub) => ({ id: String(sub.id ?? "") })),
      ])
      .filter((lesson) => lesson.id),
  }));

  const finishedModuleIndex = openModules.findIndex((module) =>
    (module.lessons ?? []).some((lesson) => String(lesson.id) === leafId),
  );
  if (finishedModuleIndex < 0) return;

  const { data: leaves } = await db
    .from("learner_leaf_completions")
    .select("leaf_id, completed_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .limit(500);
  const completedAt: Record<string, number> = {};
  const done = new Set<string>();
  for (const row of leaves ?? []) {
    const id = String((row as { leaf_id?: string }).leaf_id ?? "");
    if (!id) continue;
    done.add(id);
    const ms = Date.parse(String((row as { completed_at?: string }).completed_at ?? ""));
    if (Number.isFinite(ms)) completedAt[id] = ms;
  }
  // La feuille courante vient d’être upsertée
  done.add(leafId);
  if (!completedAt[leafId]) completedAt[leafId] = Date.now();

  const ctx = {
    now: Date.now(),
    ready: true,
    completedAt,
    isDone: (id: string) => done.has(id),
  };

  if (moduleFinishedAt(openModules[finishedModuleIndex], ctx) == null) return;

  const nextIndex = finishedModuleIndex + 1;
  if (nextIndex >= openModules.length) return;
  const nextRule = readModuleOpenRule(openModules[nextIndex]?.openRule);
  if (nextRule.mode !== "previous" || nextRule.amount <= 0) return;

  const opensAt = scheduleOpenAtForModule(openModules, nextIndex, ctx);
  if (opensAt == null || opensAt <= Date.now()) return;

  const finishedTitle =
    String(visibleSections[finishedModuleIndex]?.title ?? "").trim() ||
    `Module ${finishedModuleIndex + 1}`;
  const nextTitle =
    String(visibleSections[nextIndex]?.title ?? "").trim() || `Module ${nextIndex + 1}`;
  const nextSectionId = String(visibleSections[nextIndex]?.id ?? nextTitle);

  // Dédup : une seule notif par prochain module
  const prior = await db
    .from("learner_relances")
    .select("id")
    .eq("learner_id", userId)
    .eq("leaf_title", nextSectionId)
    .ilike("subject", "%prochain module%")
    .limit(1)
    .maybeSingle();
  if (!prior.error && prior.data?.id) return;

  const { data: profile } = await db
    .from("profiles")
    .select("email, first_name, full_name")
    .eq("id", userId)
    .maybeSingle();
  const email = String((profile as { email?: string } | null)?.email ?? "").trim();
  if (!email) return;

  const firstName =
    String((profile as { first_name?: string } | null)?.first_name ?? "").trim() ||
    String((profile as { full_name?: string } | null)?.full_name ?? "")
      .trim()
      .split(/\s+/)[0] ||
    "bonjour";

  const slug = String((course as { slug?: string }).slug ?? "").trim();
  const playHref = slug
    ? `https://edgebs.fr/formations/${encodeURIComponent(slug)}`
    : `https://edgebs.fr/dashboard/apprenant/parcours`;

  const mail = buildModuleScheduleEmail({
    firstName,
    finishedModuleTitle: finishedTitle,
    nextModuleTitle: nextTitle,
    opensAtMs: opensAt,
    courseTitle: String((course as { title?: string }).title ?? ""),
    playHref,
  });

  const sent = await sendEmail({
    to: email,
    subject: mail.subject,
    html: mail.html,
    from: EDGE_COCKPIT_FROM,
    skipBcc: true,
    tags: { type: "module-schedule-notice", course_id: courseId },
  });
  if (!sent.success) {
    console.error("[module-schedule-notice]", sent.error);
    return;
  }

  const relance = await db.from("learner_relances").insert({
    learner_id: userId,
    sent_at: new Date().toISOString(),
    subject: mail.subject,
    course_id: courseId,
    leaf_title: nextSectionId,
    channel: "email",
    kind: "module_ouvre_prevu",
    status: "envoye",
  });
  if (relance.error && /kind|status|column|schema cache/i.test(relance.error.message)) {
    await db.from("learner_relances").insert({
      learner_id: userId,
      sent_at: new Date().toISOString(),
      subject: mail.subject,
      course_id: courseId,
      leaf_title: nextSectionId,
      channel: "email",
    });
  }
}
