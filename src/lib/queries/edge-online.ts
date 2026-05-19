import { EDGE_LAB_COURSE_CATEGORY_LABELS } from "@/lib/edge-lab-course-categories";
import { EDGE_LAB_GALAXY_LOGO_URL } from "@/lib/galaxy-branding";
import type { ApprenantDashboardData, LearnerCard } from "@/lib/queries/apprenant";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type EdgeOnlineCourse = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  excerpt: string;
  image: string | null;
  categoryName: string;
  level: string | null;
  updatedAt: string | null;
  builder_snapshot?: unknown;
};

function stripHtml(s: string | null | undefined, max: number): string {
  if (s == null || String(s).trim() === "") return "";
  const t = String(s)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max)}…`;
}

function isParcoursOnly(builderSnapshot: unknown): boolean {
  const snap = builderSnapshot as { general?: { parcours_only?: unknown } } | null;
  return Boolean(snap && typeof snap === "object" && snap?.general?.parcours_only);
}

function isVisibleStatus(status: unknown): boolean {
  if (status == null || status === "") return true;
  const s = String(status).toLowerCase();
  if (s === "draft") return false;
  return s === "published" || s === "active";
}

/**
 * Cours publiés EDGE Lab pour la vitrine EDGE Online (service role, scope org uniquement).
 */
export async function getEdgeOnlinePublishedCourses(): Promise<EdgeOnlineCourse[]> {
  const db = getServiceRoleClient();
  if (!db) return [];

  const { data: orgRow, error: orgErr } = await db
    .from("organizations")
    .select("id")
    .in("slug", ["edgelab", "edge-lab"])
    .limit(1)
    .maybeSingle();

  if (orgErr || !orgRow?.id) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[edge-online] org lookup:", orgErr?.message ?? "no org");
    }
    return [];
  }

  const orgId = String(orgRow.id);

  const { data: raw, error } = await db
    .from("courses")
    .select(
      "id, title, slug, description, presentation, cover_image, hero_image_url, image_url, category_name, level, status, builder_snapshot, updated_at",
    )
    .eq("org_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(120);

  if (error || !raw?.length) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[edge-online] courses:", error?.message ?? "empty");
    }
    return [];
  }

  const out: EdgeOnlineCourse[] = [];

  for (const row of raw as Record<string, unknown>[]) {
    if (!isVisibleStatus(row.status)) continue;
    if (isParcoursOnly(row.builder_snapshot)) continue;

    const id = String(row.id ?? "");
    const title = String(row.title ?? "Formation").trim() || "Formation";
    const slugRaw = String(row.slug ?? "").trim();
    const slug = slugRaw || id;

    const image =
      (row.cover_image as string | null | undefined) ||
      (row.hero_image_url as string | null | undefined) ||
      (row.image_url as string | null | undefined) ||
      null;

    const desc = (row.description as string | null) ?? null;
    const pres = (row.presentation as string | null) ?? null;
    const excerpt = stripHtml(pres || desc, 200) || stripHtml(desc, 200);

    const categoryName = String(row.category_name ?? "").trim() || "À découvrir";

    out.push({
      id,
      title,
      slug,
      description: desc,
      excerpt,
      image,
      categoryName,
      level: row.level != null ? String(row.level) : null,
      updatedAt: row.updated_at != null ? String(row.updated_at) : null,
      builder_snapshot: row.builder_snapshot,
    });
  }

  return out;
}

const FALLBACK_LEARNER_COVER =
  "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80";

function emptyEdgeOnlineDashboardShell(): ApprenantDashboardData {
  return {
    hero: { title: "", description: "", backgroundImage: "", tags: [] },
    formations: [],
    parcours: [],
    ressources: [],
    tests: [],
    continueWatching: [],
    organizationSlug: "edgelab",
    organizationLogoUrl: EDGE_LAB_GALAXY_LOGO_URL,
    organizationName: "EDGE Lab",
    thematicSectionOrder: [...EDGE_LAB_COURSE_CATEGORY_LABELS],
  };
}

function mapPublishedToLearnerCards(courses: EdgeOnlineCourse[]): LearnerCard[] {
  return courses.map((c) => {
    const presentation = (c.excerpt || c.description || "").trim() || null;
    const base: LearnerCard & { updated_at?: string } = {
      id: c.id,
      title: c.title,
      slug: c.slug,
      href: `/formations/${encodeURIComponent(c.slug)}`,
      image: c.image ?? FALLBACK_LEARNER_COVER,
      cover_url: c.image,
      cover_image: c.image,
      presentation,
      meta: c.description,
      category_name: c.categoryName,
      category: null,
      category_id: null,
      level: c.level,
      validatedByPeerId: null,
      validatedBy: null,
      cta: null,
      progress: null,
      builder_snapshot: c.builder_snapshot,
      hero_image_url: null,
      image_url: null,
    };
    if (c.updatedAt) base.updated_at = c.updatedAt;
    return base as LearnerCard;
  });
}

function withEdgeOnlineCleanUrls(data: ApprenantDashboardData): ApprenantDashboardData {
  return {
    ...data,
    formations: data.formations.map((c) => ({
      ...c,
      href: `/formations/${encodeURIComponent(String(c.slug ?? "").trim() || c.id)}`,
    })),
  };
}

/**
 * Données « Mes formations » EDGE Lab pour la surface publique edgeonline.fr/formations :
 * même logique que `/g/edgelab/dashboard/student/learning/formations` si session ;
 * sinon catalogue publié (service role) avec liens propres `/formations/{slug}`.
 */
export async function getEdgeOnlineFormationsPageData(): Promise<ApprenantDashboardData> {
  const fromAuth = await getApprenantDashboardData("edgelab");
  if (fromAuth.formations.length > 0) {
    return withEdgeOnlineCleanUrls({
      ...fromAuth,
      organizationSlug: fromAuth.organizationSlug ?? "edgelab",
    });
  }
  const published = await getEdgeOnlinePublishedCourses();
  return {
    ...emptyEdgeOnlineDashboardShell(),
    formations: mapPublishedToLearnerCards(published),
  };
}