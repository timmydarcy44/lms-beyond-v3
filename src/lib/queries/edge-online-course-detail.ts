import type { LearnerCard, LearnerDetail, LearnerLesson, LearnerModule } from "@/lib/queries/apprenant";
import { getServiceRoleClient } from "@/lib/supabase/server";

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";

function buildModulesFromSnapshot(snapshotRaw: unknown): LearnerModule[] {
  let snapshot: { sections?: Array<Record<string, unknown>> } | null = null;
  try {
    snapshot =
      typeof snapshotRaw === "string"
        ? (JSON.parse(snapshotRaw) as { sections?: Array<Record<string, unknown>> })
        : (snapshotRaw as { sections?: Array<Record<string, unknown>> } | null);
  } catch {
    return [{ id: "default", title: "Contenu", lessons: [] }];
  }

  const modules: LearnerModule[] = [];
  const sections = Array.isArray(snapshot?.sections) ? snapshot!.sections! : [];

  sections.forEach((section, sIdx) => {
    const lessons: LearnerLesson[] = [];
    const chapters = Array.isArray(section.chapters) ? (section.chapters as Array<Record<string, unknown>>) : [];

    for (const chapter of chapters) {
      if (chapter.content || chapter.title || chapter.videoUrl || chapter.mediaUrl) {
        lessons.push({
          id: String(chapter.id ?? `chapter-${sIdx}-${lessons.length}`),
          title: String(chapter.title ?? "Sans titre"),
          type: String(chapter.type ?? (chapter.videoUrl || chapter.mediaUrl ? "video" : "document")),
          description: (chapter.content as string) || (chapter.description as string) || null,
          videoUrl: (chapter.videoUrl as string) || (chapter.mediaUrl as string) || null,
          duration: String(chapter.duration ?? "5 min"),
          kind: "chapter",
        } as LearnerLesson);
      }

      const subs = Array.isArray(chapter.subchapters)
        ? (chapter.subchapters as Array<Record<string, unknown>>)
        : [];
      for (const sub of subs) {
        if (sub.content || sub.title || sub.videoUrl || sub.mediaUrl || sub.kind) {
          const isQuiz = sub.kind === "quiz" || Boolean(sub.quiz_id);
          const isInterview = sub.kind === "experiential_interview";
          const isResource = sub.kind === "resource" || Boolean(sub.resource_id);
          lessons.push({
            id: String(sub.id ?? `sub-${sIdx}-${lessons.length}`),
            title: String(sub.title ?? "Sans titre"),
            type: String(sub.type ?? (sub.videoUrl || sub.mediaUrl ? "video" : "document")),
            description: isInterview ? "" : ((sub.content as string) || (sub.description as string) || null),
            videoUrl: (sub.videoUrl as string) || (sub.mediaUrl as string) || null,
            duration: String(sub.duration ?? "3 min"),
            kind: isQuiz
              ? "quiz"
              : isInterview
                ? "experiential_interview"
                : isResource
                  ? "resource"
                  : "subchapter",
            parentChapterId: chapter.id ? String(chapter.id) : undefined,
            quiz_id: sub.quiz_id ? String(sub.quiz_id) : undefined,
            resource_id: sub.resource_id ? String(sub.resource_id) : undefined,
          } as LearnerLesson);
        }
      }
    }

    modules.push({
      id: String(section.id ?? `section-${sIdx}`),
      title: String(section.title ?? "Section"),
      lessons,
    });
  });

  if (modules.length === 0) {
    modules.push({ id: "default", title: "Contenu", lessons: [] });
  }
  return modules;
}

/**
 * Détail formation pour `/edgeonline/formations/[slug]` — lecture service role uniquement
 * (alignée sur le listing catalogue, sans RLS session).
 */
export async function getEdgeOnlineCourseDetailBySlug(
  rawSlug: string,
): Promise<{ card: LearnerCard; detail: LearnerDetail } | null> {
  const slug = decodeURIComponent(String(rawSlug ?? "")).trim();
  if (!slug) return null;

  const db = getServiceRoleClient();
  if (!db) {
    console.error("[edge-online-detail] SUPABASE_SERVICE_ROLE_KEY missing");
    return null;
  }

  const { data: course, error } = await db
    .from("courses")
    .select("id, title, description, slug, cover_image, builder_snapshot, status")
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    console.error("[edge-online-detail] course query error", error.message, slug);
    return null;
  }
  if (!course) {
    console.error("[edge-online-detail] course not found", slug);
    return null;
  }

  const cover = String(course.cover_image ?? "").trim() || FALLBACK_COVER;
  const modules = buildModulesFromSnapshot(course.builder_snapshot);

  const card: LearnerCard = {
    id: String(course.id),
    title: String(course.title ?? "Formation"),
    slug: String(course.slug ?? slug),
    href: `/edgeonline/formations/${encodeURIComponent(slug)}`,
    image: cover,
    cover_image: cover,
    meta: course.description ? String(course.description).slice(0, 160) : null,
  };

  const detail: LearnerDetail = {
    title: String(course.title ?? "Formation"),
    subtitle: null,
    backgroundImage: cover,
    meta: ["EDGE Online"],
    modules,
    description: String(course.description ?? ""),
    tags: ["EDGE Online"],
    trailerUrl: null,
  };

  console.log("[edge-online-detail] ok", { id: card.id, slug: card.slug, modules: modules.length });
  return { card, detail };
}
