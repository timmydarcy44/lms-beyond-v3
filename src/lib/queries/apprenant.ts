import { extractChapterPlainText } from "@/lib/course-builder/chapter-content-text";
import type { CourseBuilderChapter } from "@/types/course-builder";
import { EDGE_LAB_COURSE_CATEGORY_LABELS } from "@/lib/edge-lab-course-categories";
import {
  EDGE_LAB_GALAXY_LOGO_URL,
  isEdgeLabOrganizationSlug,
  isPlaymakersOrganizationSlug,
} from "@/lib/galaxy-branding";
import { PLAYMAKERS_BRANDING_LOGO_URL } from "@/lib/queries/organization-nav";
import { getServerClient, getServiceRoleClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import {
  getLearnerEarnedOpenBadges,
  getLearnerVisibleOpenBadges,
  type LearnerEarnedOpenBadge,
  type LearnerVisibleOpenBadge,
} from "@/lib/openbadges/learner-visible-badges";
import { headers } from "next/headers";

// Fonction pour récupérer les formateurs disponibles pour un apprenant
export async function getAvailableInstructors(): Promise<Array<{ id: string; name: string; email: string }>> {
  const supabase = await getServerClient();
  if (!supabase) return [];

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return [];

    const userId = authData.user.id;

    // Récupérer les organisations de l'apprenant
    const { data: learnerMemberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .eq("role", "learner");

    if (!learnerMemberships || learnerMemberships.length === 0) {
      return [];
    }

    const orgIds = learnerMemberships.map((m) => m.org_id);

    // Récupérer les formateurs dans ces organisations
    const { data: instructorMemberships } = await supabase
      .from("org_memberships")
      .select("user_id, org_id")
      .in("org_id", orgIds)
      .eq("role", "instructor");

    if (!instructorMemberships || instructorMemberships.length === 0) {
      return [];
    }

    const instructorIds = [...new Set(instructorMemberships.map((m) => m.user_id))];

    // Récupérer les profils des formateurs
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name")
      .in("id", instructorIds);

    if (!profiles) return [];

    return profiles.map((p) => ({
      id: p.id,
      name: p.full_name || p.email || "Formateur",
      email: p.email || "",
    }));
  } catch (error) {
    console.error("[apprenant] Error fetching instructors:", error);
    return [];
  }
}

// Types de base pour l'apprenant (types minimaux nécessaires)
export type LearnerCard = {
  id: string;
  title: string;
  slug: string;
  href: string;
  image?: string | null;
  /** URL média (image ou vidéo) — aligné sur `courses.cover_image` (+ `cover_url` si présent côté DB). */
  cover_url?: string | null;
  /** Fichier / clé telle qu’en base (`courses.cover_image`) — pour les cartes qui lisent ce champ en priorité. */
  cover_image?: string | null;
  /** Texte de présentation cours (`courses.presentation`). */
  presentation?: string | null;
  meta?: string | null;
  category?: string | null;
  category_id?: string | null;
  category_name?: string | null;
  level?: string | null;
  validatedByPeerId?: string | null;
  validatedBy?: { id: string; name: string; avatarUrl?: string | null } | null;
  cta?: string | null;
  progress?: number | null;
  /** Présent si le select Supabase l’inclut — utilisé pour `general.cover_image` côté UI. */
  builder_snapshot?: unknown;
  hero_image_url?: string | null;
  image_url?: string | null;
};

/** Même règle partout (inscriptions + catalogue org) : les brouillons ne sont pas listés. */
function isCourseStatusVisibleForApprenant(status: unknown): boolean {
  return (
    status === "published" ||
    status === "active" ||
    status == null ||
    !status
  );
}

function courseRowToLearnerCard(course: Record<string, unknown>): LearnerCard {
  const coverMedia =
    (course.cover_image as string | undefined) ||
    (course.hero_image_url as string | undefined) ||
    (course.image_url as string | undefined) ||
    null;
  return {
    id: String(course.id),
    title: (course.title as string) || "Formation sans titre",
    slug: (course.slug as string) || String(course.id),
    href: `/catalog/formations/${(course.slug as string) || course.id}`,
    image:
      coverMedia ||
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    cover_url: coverMedia,
    cover_image: (course.cover_image as string | null | undefined) ?? null,
    presentation: (course.presentation as string | null | undefined) ?? null,
    meta: (course.description as string | null) || null,
    category: (course.category as string | null) || null,
    category_id: course.category_id ? String(course.category_id) : null,
    category_name: (course.category_name as string | null | undefined) ?? null,
    level:
      (course.level as string | null) ??
      (course.builder_snapshot as { general?: { level?: string } } | null)?.general?.level ??
      null,
    validatedByPeerId: course.validated_by_peer_id ? String(course.validated_by_peer_id) : null,
    validatedBy: null,
    cta: "Continuer",
    progress: 0,
    builder_snapshot: (course as { builder_snapshot?: unknown }).builder_snapshot,
    hero_image_url: (course.hero_image_url as string | null | undefined) ?? null,
    image_url: (course.image_url as string | null | undefined) ?? null,
  };
}

function isCourseParcoursOnly(course: Record<string, unknown>): boolean {
  const snap = (course.builder_snapshot as any) ?? null;
  const v = snap && typeof snap === "object" ? (snap as any)?.general?.parcours_only : null;
  return Boolean(v);
}

export type LearnerHero = {
  title: string;
  description: string;
  backgroundImage: string | null;
  badge?: string | null;
  meta?: string | null;
  tags: string[];
};

export type LearnerDetail = {
  title: string;
  subtitle?: string | null;
  backgroundImage: string | null;
  badge?: { label: string; description?: string } | null;
  meta: string[];
  modules: any[];
  objectives?: string[];
  skills?: string[];
  trailerUrl?: string | null;
  description?: string;
  tags?: string[];
  /** `courses.validated_by_peer_id` (absent du seul `builder_snapshot`). */
  validatedByPeerId?: string | null;
  /** Ligne `validators` résolue côté serveur (RLS côté client souvent bloquante). */
  validatorForBadge?: { name: string; professional_title: string; photo_url?: string } | null;
};

function normalizeValidatorPhotoPublicUrl(url: string): string {
  return url
    .replace("/object/public/playmakers/", "/object/public/Playmakers/")
    .replace("/object/public/home/", "/object/public/Home/");
}

function mapValidatorRowToBadgeForCatalog(
  row: Record<string, unknown> | null,
): { name: string; professional_title: string; photo_url?: string } | null {
  if (!row) return null;
  const full = String(row.full_name ?? "").trim();
  const first = String(row.first_name ?? "").trim();
  const last = String(row.last_name ?? "").trim();
  const name = full || `${first} ${last}`.trim();
  if (!name) return null;
  const professional_title = String(
    row.professionnal_title ?? row.professional_title ?? "",
  ).trim();
  const raw = String(row.photo_url ?? "").trim();
  const photo_url = raw ? normalizeValidatorPhotoPublicUrl(raw) : undefined;
  return { name, professional_title, ...(photo_url ? { photo_url } : {}) };
}

export type LearnerModule = {
  id: string;
  title: string;
  lessons?: LearnerLesson[];
  description?: string;
  length?: string;
};

export type LearnerLesson = {
  id: string;
  title: string;
  type?: string;
  description?: string;
  videoUrl?: string;
  duration?: string;
  kind?: "chapter" | "subchapter" | "test" | "quiz" | "experiential_interview";
  parentChapterId?: string;
  quiz_id?: string;
  interview_context?: string;
  interview_objectives?: string;
  /** UUID chapitre/sous-chapitre en base (pont avec flashcards `chapter_id` et cache local). */
  dbChapterId?: string | null;
};

export type LearnerFlashcard = {
  id: string;
  front: string;
  back: string;
};

export type ApprenantDashboardData = {
  hero: LearnerHero;
  formations: LearnerCard[];
  parcours: LearnerCard[];
  ressources: LearnerCard[];
  tests: LearnerCard[];
  continueWatching: LearnerCard[];
  /** Slug org résolu (param, header `x-org-slug`, etc.) — pour branding côté client sans snapshot. */
  organizationSlug?: string | null;
  organizationLogoUrl?: string | null;
  organizationName?: string | null;
  /**
   * EDGE Lab : ordre des thématiques business (côté client aussi via `EDGE_LAB_COURSE_CATEGORY_LABELS`).
   * Playmakers : `null` — l’apprenant groupe dynamiquement par `category` / `category_name`.
   */
  thematicSectionOrder?: string[] | null;
  /** Open Badges actifs visibles sur le dashboard (pastille « Disponible pour vous »). */
  visibleOpenBadges?: LearnerVisibleOpenBadge[];
  /** Open Badges obtenus (EDGE Wallet). */
  earnedOpenBadges?: LearnerEarnedOpenBadge[];
};

export type PathContentDetail = {
  steps?: any[];
  title?: string | null;
  cover_image?: string | null;
  presentation?: string | null;
  tools?: string[];
  objectifs?: string[];
  courses: Array<{ id: string; title: string; slug: string; cover_url?: string | null }>;
  tests: Array<{ id: string; title: string; slug: string }>;
  resources: Array<{ id: string; title: string; slug: string }>;
};

export type LearnerCategory = "formations" | "parcours" | "ressources" | "tests";

export function isLearnerCategory(category: string): category is LearnerCategory {
  return ["formations", "parcours", "ressources", "tests"].includes(category);
}

// Fonctions stub pour éviter les erreurs de build (à implémenter complètement après)
export async function getApprenantDashboardData(
  options?: string | { orgSlug?: string | null },
): Promise<ApprenantDashboardData> {
  const supabase = await getServerClient();
  if (!supabase) {
    return {
      hero: {
        title: "Bienvenue",
        description: "",
        backgroundImage: "",
        tags: [],
      },
      formations: [],
      parcours: [],
      ressources: [],
      tests: [],
      continueWatching: [],
      organizationSlug: null,
      organizationLogoUrl: null,
      organizationName: null,
      thematicSectionOrder: null,
      visibleOpenBadges: [],
      earnedOpenBadges: [],
    };
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return {
        hero: {
          title: "Bienvenue",
          description: "",
          backgroundImage: "",
          tags: [],
        },
        formations: [],
        parcours: [],
        ressources: [],
        tests: [],
        continueWatching: [],
        organizationSlug: null,
        organizationLogoUrl: null,
        organizationName: null,
        thematicSectionOrder: null,
        visibleOpenBadges: [],
        earnedOpenBadges: [],
      };
    }

    const h = await headers();
    const explicitSlug = typeof options === "string" ? options : options?.orgSlug;
    const explicitSlugNorm = String(explicitSlug ?? "").trim() || null;
    // Branding slug: can come from header, even on non-galaxy pages.
    const orgSlugForBranding =
      explicitSlugNorm ||
      (h.get("x-org-slug") ?? "").trim() ||
      null;
    const organizationSlug = orgSlugForBranding ? orgSlugForBranding.toLowerCase().replace(/_/g, "-") : null;

    let currentOrgId: string | null = null;
    let organizationLogoUrl: string | null = null;
    let organizationName: string | null = null;

    // Scope org: UNIQUEMENT si l’orgSlug est explicitement passé (routes /g/[orgSlug]/...).
    // Sinon, on évite de sur-filtrer le dashboard “global” à cause d’un header stale.
    const organizationSlugForScope = explicitSlugNorm ? explicitSlugNorm.toLowerCase().replace(/_/g, "-") : null;

    /** Sous `/g/{slug}/…` : lecture org + catalogue + inscriptions avec service role si dispo (évite RLS / colonnes manquantes). */
    const galaxyReadClient =
      organizationSlugForScope != null ? (await getServiceRoleClientOrFallback()) ?? supabase : supabase;

    // Galaxie : résoudre l’org par slug (`id, name, slug` seuls — compatibles toutes les versions de schéma)
    if (organizationSlugForScope) {
      try {
        const { data: orgRow } = await galaxyReadClient
          .from("organizations")
          .select("id, name, slug")
          .eq("slug", organizationSlugForScope)
          .maybeSingle();
        type OrgRef = { id?: string; name?: string | null; slug?: string | null };
        let found: OrgRef | null = orgRow as OrgRef | null;
        if (!found && isEdgeLabOrganizationSlug(organizationSlugForScope)) {
          const { data: byAltSlugs } = await galaxyReadClient
            .from("organizations")
            .select("id, name, slug")
            .in("slug", ["edgelab", "edge-lab"]);
          if (byAltSlugs && byAltSlugs.length === 1) {
            found = byAltSlugs[0] as OrgRef;
          } else if (byAltSlugs && byAltSlugs.length > 1) {
            found =
              (byAltSlugs as OrgRef[]).find(
                (r) => String(r?.slug ?? "").toLowerCase().replace(/_/g, "-") === organizationSlug,
              ) ?? (byAltSlugs[0] as OrgRef);
          }
        }
        if (!found && isPlaymakersOrganizationSlug(organizationSlugForScope)) {
          const { data: pm } = await galaxyReadClient
            .from("organizations")
            .select("id, name, slug")
            .in("slug", ["playmakers", "play-maker", "play_makers"])
            .limit(3);
          const rows = (pm as OrgRef[] | null) ?? [];
          found = rows.find((r) => String(r?.slug ?? "").toLowerCase().replace(/_/g, "-") === "playmakers") ?? rows[0] ?? null;
        }
        if (found) {
          currentOrgId = String((found as OrgRef).id ?? "").trim() || null;
          organizationName = String((found as OrgRef).name ?? "").trim() || null;
        }
      } catch (e) {
        console.warn("[apprenant] organizations lookup (slug) failed:", e);
      }
    }

    if (organizationSlug && isEdgeLabOrganizationSlug(organizationSlug)) {
      /* Logo fiable (bucket) — n’hérite pas d’une `logo_url` en base erronée / 404. */
      organizationLogoUrl = EDGE_LAB_GALAXY_LOGO_URL;
    }
    if (organizationSlug && isPlaymakersOrganizationSlug(organizationSlug)) {
      organizationLogoUrl = PLAYMAKERS_BRANDING_LOGO_URL;
    }

    // Récupérer les formations assignées via enrollments (schéma normalisé: user_id + course_id)
    let formations: LearnerCard[] = [];
    
    try {
      // Essayer d'abord avec enrollments (sans colonnes qui pourraient ne pas exister)
      let enrollmentsQuery = galaxyReadClient
        .from("enrollments")
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            presentation,
            slug,
            cover_image,
            image_url,
            hero_image_url,
            builder_snapshot,
            status,
            creator_id,
            category,
            category_id,
            category_name,
            level,
            validated_by_peer_id
          )
        `)
        .eq("user_id", user.id);

      if (currentOrgId) {
        enrollmentsQuery = enrollmentsQuery.eq("courses.org_id", currentOrgId);
      }

      const { data: enrollments, error: enrollError } = await enrollmentsQuery;

      if (enrollError) {
        // Log minimal (évite bruit console en prod/dev).
        console.warn("[apprenant] enrollments fetch failed:", enrollError.message);
      } else if (enrollments && enrollments.length > 0) {
        for (const enrollment of enrollments) {
          const course = (enrollment as any).courses;
          if (course) {
            if (isCourseParcoursOnly(course as any)) continue;
            const c = course as {
              cover_url?: string | null;
              cover_image?: string | null;
              image_url?: string | null;
              hero_image_url?: string | null;
            };
            const coverMedia = c.cover_image || c.hero_image_url || c.image_url || c.cover_url || null;
            if (isCourseStatusVisibleForApprenant((course as { status?: unknown }).status)) {
              formations.push({
                id: course.id,
                title: course.title || "Formation sans titre",
                slug: course.slug || course.id,
                href: `/catalog/formations/${course.slug || course.id}`,
                // Utiliser seulement les colonnes qui existent
                image: coverMedia || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
                cover_url: coverMedia,
                cover_image: c.cover_image || null,
                presentation: course.presentation ?? null,
                meta: course.description || null,
                category: course.category || null,
                category_id: (course as { category_id?: string | null }).category_id
                  ? String((course as { category_id?: string | null }).category_id)
                  : null,
                category_name: (course as { category_name?: string | null }).category_name ?? null,
                level: (course as any).level ?? (course as any)?.builder_snapshot?.general?.level ?? null,
                validatedByPeerId: (course as any)?.validated_by_peer_id ? String((course as any).validated_by_peer_id) : null,
                validatedBy: null,
                cta: "Continuer",
                progress: 0,
                builder_snapshot: (course as { builder_snapshot?: unknown }).builder_snapshot,
                hero_image_url: c.hero_image_url ?? null,
                image_url: c.image_url ?? null,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error("[apprenant] Exception fetching enrollments:", error);
    }

    // Si pas de formations via enrollments, essayer directement via courses
    // en utilisant les course_ids des enrollments
    if (formations.length === 0) {
      console.log("[apprenant] Trying direct course fetch via enrollments course_ids");
      try {
        // Récupérer d'abord les course_ids depuis enrollments (sans join)
        const { data: enrollmentIds, error: idsError } = await galaxyReadClient
          .from("enrollments")
          .select("course_id")
          .eq("user_id", user.id);

        if (!idsError && enrollmentIds && enrollmentIds.length > 0) {
          const courseIds = enrollmentIds.map(e => e.course_id).filter(Boolean);
          console.log("[apprenant] Found course_ids from enrollments:", courseIds);

          // Récupérer les courses directement (sans colonnes qui pourraient ne pas exister)
          // Essayer d'abord avec les colonnes de base
          let courses: any[] = [];
          let coursesError: any = null;
          
          // Essayer avec les colonnes de base (sans published qui n'existe peut-être pas)
          let baseCoursesQuery = galaxyReadClient
            .from("courses")
            .select(
              "id, title, description, presentation, slug, cover_image, image_url, hero_image_url, builder_snapshot, status, creator_id, category, category_id, category_name, level, validated_by_peer_id",
            )
            .in("id", courseIds);

          if (currentOrgId) {
            baseCoursesQuery = baseCoursesQuery.eq("org_id", currentOrgId);
          }

          const { data: coursesData, error: coursesErr } = await baseCoursesQuery;
          
          if (coursesErr) {
            console.error("[apprenant] Error fetching courses with base columns:", coursesErr);
            // Essayer avec encore moins de colonnes
            let minimalQuery = galaxyReadClient
              .from("courses")
              .select("id, title, description, presentation, slug, status")
              .in("id", courseIds);

            if (currentOrgId) {
              minimalQuery = minimalQuery.eq("org_id", currentOrgId);
            }

            const { data: coursesMinimal, error: coursesMinErr } = await minimalQuery;
            
            if (coursesMinErr) {
              coursesError = coursesMinErr;
              console.error("[apprenant] Error fetching courses with minimal columns:", coursesMinErr);
            } else {
              courses = coursesMinimal || [];
            }
          } else {
            courses = (coursesData as any[]) || [];
          }

          if (coursesError) {
            console.error("[apprenant] Error fetching courses directly:", coursesError);
            console.error("[apprenant] Error code:", coursesError.code);
            console.error("[apprenant] Error message:", coursesError.message);
          } else if (courses && courses.length > 0) {
            console.log("[apprenant] Found courses directly:", courses.length);
            // Filtrer par status si disponible, sinon prendre tous
            const publishedCourses = courses.filter((course: any) =>
              isCourseStatusVisibleForApprenant(course.status),
            );
            console.log("[apprenant] Published courses after filtering:", publishedCourses.length);
            formations = publishedCourses.map((course: any) => {
              const coverMedia =
                course.hero_image_url || course.image_url || course.cover_image || course.cover_url || null;
              return {
              id: course.id,
              title: course.title || "Formation sans titre",
              slug: course.slug || course.id,
              href: `/catalog/formations/${course.slug || course.id}`,
              // Utiliser seulement les colonnes qui existent
              image: coverMedia || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
              cover_url: coverMedia,
              cover_image: course.cover_image || null,
              presentation: course.presentation ?? null,
              meta: course.description || null,
              category: course.category || null,
              category_id: course.category_id ? String(course.category_id) : null,
              category_name: course.category_name ?? null,
              level: course.level ?? course?.builder_snapshot?.general?.level ?? null,
              validatedByPeerId: course.validated_by_peer_id ? String(course.validated_by_peer_id) : null,
              validatedBy: null,
              cta: "Continuer",
            };
            });
          }
        }
    } catch (error) {
      console.error("[apprenant] Exception in direct course fetch:", error);
      }
    }

    // Catalogue de la galaxie : fusionner les cours de l’org (hors brouillons), même sans inscription
    if (currentOrgId) {
      try {
        const courseClient = organizationSlugForScope ? galaxyReadClient : ((await getServiceRoleClientOrFallback()) ?? supabase);
        const { data: orgCourses, error: orgCoursesErr } = await courseClient
          .from("courses")
          .select(
            "id, title, description, presentation, slug, cover_image, image_url, hero_image_url, builder_snapshot, status, category, category_id, category_name, level, validated_by_peer_id",
          )
          .eq("org_id", currentOrgId);

        if (orgCoursesErr) {
          console.warn("[apprenant] Org catalog fetch failed:", orgCoursesErr.message);
        } else {
          const published = (orgCourses ?? []).filter((row) =>
            isCourseStatusVisibleForApprenant((row as { status?: unknown }).status),
          );
          const byId = new Map<string, LearnerCard>();
          for (const c of formations) {
            byId.set(c.id, c);
          }
          for (const row of published) {
            if (isCourseParcoursOnly(row as any)) continue;
            const id = String((row as { id?: string }).id ?? "");
            if (!id || byId.has(id)) continue;
            byId.set(id, courseRowToLearnerCard(row as Record<string, unknown>));
          }
          formations = Array.from(byId.values());
        }
      } catch (e) {
        console.warn("[apprenant] Staff org catalog exception:", e);
      }
    }

    // Résoudre les validateurs (best-effort)
    try {
      const validatorIds = [
        ...new Set(
          formations
            .map((c) => (c as any)?.validatedByPeerId ?? null)
            .filter(Boolean)
            .map((x) => String(x)),
        ),
      ];
      if (validatorIds.length > 0) {
        const { data: vRows } = await supabase.from("validators").select("*").in("id", validatorIds);
        const byId = new Map<string, any>();
        for (const r of (vRows ?? []) as any[]) {
          if (!r?.id) continue;
          byId.set(String(r.id), r);
        }
        formations = formations.map((c: any) => {
          const vid = String(c?.validatedByPeerId ?? "").trim();
          if (!vid) return c;
          const v = byId.get(vid);
          if (!v) return c;
          const first = String(v?.first_name ?? "").trim();
          const last = String(v?.last_name ?? "").trim();
          const derived = `${first} ${last}`.trim();
          const name =
            String(v?.full_name ?? v?.display_name ?? v?.name ?? derived ?? v?.email ?? vid).trim() || vid;
          const avatarUrl =
            String(v?.avatar_url ?? v?.photo_url ?? v?.image_url ?? v?.profile_url ?? "").trim() || null;
          return {
            ...c,
            validatedBy: { id: vid, name, avatarUrl },
          };
        });
      }
    } catch {
      // ignore
    }

    /**
     * Ordre des sections : listes métiers (Playmakers / EDGE Lab) pour éviter
     * que des libellés historiques finissent tous en « Autres » ; sinon `course_categories`.
     */
    let thematicSectionOrder: string[] | null = null;
    if (organizationSlug && isPlaymakersOrganizationSlug(organizationSlug)) {
      thematicSectionOrder = null;
    } else if (organizationSlug && isEdgeLabOrganizationSlug(organizationSlug)) {
      thematicSectionOrder = [...EDGE_LAB_COURSE_CATEGORY_LABELS];
    } else if (currentOrgId) {
      try {
        const catClient = getServiceRoleClient() ?? supabase;
        const { data: catRows, error: catErr } = await catClient
          .from("course_categories")
          .select("name")
          .eq("organization_id", currentOrgId)
          .order("name", { ascending: true });
        if (!catErr && catRows?.length) {
          const names = (catRows as { name?: string | null }[])
            .map((r) => String(r?.name ?? "").trim())
            .filter(Boolean);
          if (names.length) thematicSectionOrder = names;
        }
      } catch (e) {
        console.warn("[apprenant] course_categories lookup failed:", e);
      }
    }

    console.log("[apprenant] Total formations found:", formations.length);

    const parcours: LearnerCard[] = [];

    // Accès apprenant = (inscription) + (appartenance org).
    // On récupère la liste des orgs où l'utilisateur est membre.
    // (les libellés de rôle varient selon les environnements, donc on ne filtre pas strictement ici)
    // null = on n'a pas réussi à résoudre les orgs (on évite alors de sur-filtrer)
    let learnerOrgIds: string[] | null = null;
    try {
      const orgClient = (await getServiceRoleClientOrFallback()) ?? supabase;
      const runMemberships = async (userField: "user_id" | "profile_id") => {
        return await orgClient.from("org_memberships").select("org_id, role").eq(userField, user.id);
      };

      let memberships: any[] | null = null;
      let mErr: any | null = null;
      {
        const res = await runMemberships("user_id");
        memberships = (res as any).data ?? null;
        mErr = (res as any).error ?? null;
      }
      if ((mErr?.code === "PGRST204" || mErr?.code === "42703") && memberships == null) {
        const res = await runMemberships("profile_id");
        memberships = (res as any).data ?? null;
        mErr = (res as any).error ?? null;
      }

      if (!mErr && memberships?.length) {
        const ids = (memberships as any[])
          .map((m) => String(m?.org_id ?? "").trim())
          .filter(Boolean);
        learnerOrgIds = Array.from(new Set(ids));
      } else {
        // aucune org (membre de rien) => liste vide volontairement
        learnerOrgIds = [];
      }
    } catch {
      // échec de résolution => ne pas filtrer par org (fail-open) pour éviter un dashboard vide
      learnerOrgIds = null;
    }

    // Inscriptions parcours : on évite les jointures PostgREST (`paths(...)`) car elles dépendent
    // de la détection des FK/caches. On fait donc un fetch en 2 temps:
    // 1) path_ids via table pivot
    // 2) paths via IN(path_ids) + scope org
    try {
      const parcoursClient = (await getServiceRoleClientOrFallback()) ?? supabase;

      const runPivot = async (table: "path_enrollments" | "path_progress") => {
        const pivot = parcoursClient.from(table).select("path_id").eq("user_id", user.id).limit(200);
        const { data, error } = await pivot;
        if (error || !data?.length) return [] as string[];
        return (data as any[]).map((r) => String(r?.path_id ?? "").trim()).filter(Boolean);
      };

      let pathIds: string[] = [];
      // priority: path_enrollments
      pathIds = await runPivot("path_enrollments");
      if (pathIds.length === 0) {
        // fallback: older envs might use path_progress
        pathIds = await runPivot("path_progress");
      }

      if (pathIds.length > 0) {
        const runPathsQuery = async (select: string) => {
          let q = parcoursClient.from("paths").select(select).in("id", pathIds).limit(200);
          if (currentOrgId) {
            q = q.eq("org_id", currentOrgId);
          } else if (Array.isArray(learnerOrgIds)) {
            if (learnerOrgIds.length === 0) {
              q = q.limit(0);
            } else {
              q = q.in("org_id", learnerOrgIds);
            }
          }
          return await q;
        };

        // Schémas `paths` variables: certaines DB n'ont pas `cover_image` / `description` / `status`.
        let rows: any[] | null = null;
        let err: any | null = null;
        {
          const res = await runPathsQuery("id, org_id, title, description, cover_image, status, creator_id, path_snapshot");
          rows = (res as any).data ?? null;
          err = (res as any).error ?? null;
        }
        if (err?.code === "42703") {
          const res = await runPathsQuery("id, org_id, title, cover_image, status, path_snapshot");
          rows = (res as any).data ?? null;
          err = (res as any).error ?? null;
        }
        if (err?.code === "42703") {
          const res = await runPathsQuery("id, org_id, title, status, path_snapshot");
          rows = (res as any).data ?? null;
          err = (res as any).error ?? null;
        }
        if (err?.code === "42703") {
          const res = await runPathsQuery("id, org_id, title, path_snapshot");
          rows = (res as any).data ?? null;
          err = (res as any).error ?? null;
        }

        if (!err && rows?.length) {
          const byId = new Map((rows as any[]).map((p) => [String(p.id), p]));
          for (const pid of pathIds) {
            const path = byId.get(pid);
            if (!path) continue;
            const snap = path.path_snapshot && typeof path.path_snapshot === "object" ? path.path_snapshot : null;
            const slug = String((snap as any)?.slug ?? path.id).trim() || String(path.id);
            const isPublished = String(path.status ?? "").toLowerCase().trim() === "published";
            const href = organizationSlug
              ? `/g/${encodeURIComponent(String(organizationSlug))}/dashboard/student/learning/parcours/${encodeURIComponent(String(slug))}`
              : `/dashboard/student/learning/parcours/${slug}`;
            parcours.push({
              id: String(path.id),
              title: path.title || "Parcours sans titre",
              slug,
              href,
              image:
                path.cover_image ||
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
              meta: path.description || (isPublished ? null : "Parcours en cours de préparation"),
              cta: "Continuer",
            });
          }
        }
      }
    } catch (e) {
      console.warn("[apprenant] parcours pivot->paths lookup failed:", e);
    }

    // Fallback: assignation via `paths.path_snapshot.assignment.learnerIds`
    // (certains environnements n'écrivent pas dans `path_progress` lors de l'assignation).
    try {
      if (parcours.length === 0) {
        const parcoursClient = (await getServiceRoleClientOrFallback()) ?? supabase;
        let pathsQuery = parcoursClient
          .from("paths")
          .select("id, org_id, title, description, cover_image, status, creator_id, path_snapshot")
          .order("created_at", { ascending: false })
          .limit(50);

        if (currentOrgId) {
          pathsQuery = pathsQuery.eq("org_id", currentOrgId);
        } else if (Array.isArray(learnerOrgIds)) {
          if (learnerOrgIds.length === 0) {
            pathsQuery = pathsQuery.limit(0);
          } else {
            pathsQuery = pathsQuery.in("org_id", learnerOrgIds);
          }
        }

        const { data: assignedBySnap, error: assignedBySnapError } = await pathsQuery;
        if (!assignedBySnapError && assignedBySnap?.length) {
          for (const row of assignedBySnap as any[]) {
            const snap = row?.path_snapshot;
            const assignment = snap && typeof snap === "object" ? (snap as any).assignment : null;
            const learnerIds = Array.isArray(assignment?.learnerIds)
              ? (assignment.learnerIds as any[]).map((x) => String(x ?? "").trim()).filter(Boolean)
              : [];

            if (!learnerIds.includes(user.id)) continue;

            const slug = String(((snap as any)?.slug ?? row.id) ?? "").trim() || String(row.id);
            const isPublished = String(row.status ?? "").toLowerCase().trim() === "published";
            const href = organizationSlug
              ? `/g/${encodeURIComponent(String(organizationSlug))}/dashboard/student/learning/parcours/${encodeURIComponent(String(slug))}`
              : `/dashboard/student/learning/parcours/${slug}`;

            parcours.push({
              id: row.id,
              title: row.title || "Parcours sans titre",
              slug,
              href,
              image:
                row.cover_image ||
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
              meta: row.description || (isPublished ? null : "Parcours en cours de préparation"),
              cta: "Continuer",
            });
          }
        }
      }
    } catch (e) {
      console.warn("[apprenant] fallback paths via snapshot failed:", e);
    }

    // Récupérer les ressources assignées via content_assignments ou resource_views
    let resourceViewsQuery = supabase
      .from("resource_views")
      .select(`
        resource_id,
        resources (
          id,
          title,
          description,
          kind,
          file_url,
          cover_url,
          published,
          creator_id
        )
      `)
      .eq("user_id", user.id)
      .limit(10);

    if (currentOrgId) {
      resourceViewsQuery = resourceViewsQuery.eq("resources.org_id", currentOrgId);
    }

    const { data: resourceViews, error: resourceError } = await resourceViewsQuery;

    const ressources: LearnerCard[] = [];
    if (!resourceError && resourceViews) {
      for (const view of resourceViews) {
        const resource = (view as any).resources;
        if (resource && resource.published) {
          ressources.push({
            id: resource.id,
            title: resource.title || "Ressource sans titre",
            slug: resource.id,
            href: `/ressources/${resource.id}`,
            image: resource.cover_url || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
            meta: resource.description || null,
            cta: "Consulter",
          });
        }
      }
    }

    // Récupérer les tests assignés (via content_assignments ou test_attempts)
    let testAttemptsQuery = supabase
      .from("test_attempts")
      .select(`
        test_id,
        tests (
          id,
          title,
          description,
          cover_image,
          published,
          creator_id
        )
      `)
      .eq("user_id", user.id)
      .limit(10);

    if (currentOrgId) {
      testAttemptsQuery = testAttemptsQuery.eq("tests.org_id", currentOrgId);
    }

    const { data: testAttempts, error: testError } = await testAttemptsQuery;

    const tests: LearnerCard[] = [];
    
    // Récupérer les tests depuis les tentatives
    if (!testError && testAttempts) {
      for (const attempt of testAttempts) {
        const test = (attempt as any).tests;
        if (test && (test.published || test.status === "published")) {
          tests.push({
            id: test.id,
            title: test.title || "Test sans titre",
            slug: test.slug || test.id,
            href: `/dashboard/student/learning/tests/${test.slug || test.id}`,
            image: test.cover_image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
            meta: test.description || null,
            cta: "Passer le test",
          });
        }
      }
    }

    // Récupérer aussi les tests assignés aux formations auxquelles l'apprenant est inscrit
    if (formations.length > 0) {
      const courseIds = formations.map(f => f.id);
      const { data: courseTests, error: courseTestsError } = await supabase
        .from("course_tests")
        .select(`
          test_id,
          course_id,
          tests (
            id,
            title,
            description,
            slug,
            status,
            cover_image
          )
        `)
        .in("course_id", courseIds);

      if (!courseTestsError && courseTests) {
        const testIdsInAttempts = new Set(tests.map(t => t.id));
        for (const courseTest of courseTests) {
          const test = (courseTest as any).tests;
          if (test && test.status === "published" && !testIdsInAttempts.has(test.id)) {
            tests.push({
              id: test.id,
              title: test.title || "Test sans titre",
              slug: test.slug || test.id,
              href: `/dashboard/student/learning/tests/${test.slug || test.id}`,
              image: test.cover_image || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
              meta: test.description || null,
              cta: "Passer le test",
            });
            testIdsInAttempts.add(test.id);
          }
        }
      }
    }

    const badgeOrgIds = currentOrgId
      ? [currentOrgId]
      : Array.isArray(learnerOrgIds)
        ? learnerOrgIds
        : [];
    let visibleOpenBadges: LearnerVisibleOpenBadge[] = [];
    let earnedOpenBadges: LearnerEarnedOpenBadge[] = [];
    try {
      visibleOpenBadges = await getLearnerVisibleOpenBadges(
        user.id,
        badgeOrgIds[0] ?? null,
        badgeOrgIds,
      );
      earnedOpenBadges = await getLearnerEarnedOpenBadges(user.id, badgeOrgIds);
    } catch (badgeErr) {
      console.warn("[apprenant] visible open badges:", badgeErr);
    }

        return {
      hero: {
        title: "Bienvenue",
        description: "Continuez votre apprentissage",
        backgroundImage: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1920&q=80",
        tags: [],
      },
      formations,
      parcours,
      ressources,
      tests,
      continueWatching: [...formations.slice(0, 3), ...parcours.slice(0, 2)],
      organizationSlug,
      organizationLogoUrl,
      organizationName,
      thematicSectionOrder,
      visibleOpenBadges,
      earnedOpenBadges,
    };
  } catch (error) {
    console.error("[apprenant] Error in getApprenantDashboardData:", error);
    return {
      hero: {
        title: "Bienvenue",
        description: "",
        backgroundImage: "",
        tags: [],
      },
      formations: [],
      parcours: [],
      ressources: [],
      tests: [],
      continueWatching: [],
      organizationSlug: null,
      organizationLogoUrl: null,
      organizationName: null,
      thematicSectionOrder: null,
      visibleOpenBadges: [],
      earnedOpenBadges: [],
    };
  }
}

export async function getLearnerContentDetail(
  category: LearnerCategory,
  slug: string
): Promise<{ card: LearnerCard; detail: LearnerDetail; related?: LearnerCard[] } | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  try {
    // Pour les formations (courses), récupérer depuis le slug ou l'ID
    if (category === "formations") {
      console.log("[apprenant] Fetching course with slug/id:", slug);
      
      // Essayer d'abord avec le slug
      let { data: course, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description, slug, cover_image, builder_snapshot, status, validated_by_peer_id")
        .eq("slug", slug)
        .maybeSingle();

      // Si pas trouvé par slug, essayer par ID
      if (!course && !courseError && slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log("[apprenant] Slug looks like UUID, trying by ID:", slug);
        const result = await supabase
          .from("courses")
          .select("id, title, description, slug, cover_image, builder_snapshot, status, validated_by_peer_id")
          .eq("id", slug)
          .maybeSingle();
        course = result.data;
        courseError = result.error;
      }

      // Si toujours pas trouvé, essayer avec published = true en plus (pour les courses du catalogue)
      if (!course && !courseError) {
        console.log("[apprenant] Trying with published check:", slug);
        const result = await supabase
          .from("courses")
          .select("id, title, description, slug, cover_image, builder_snapshot, status, validated_by_peer_id")
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .or("status.eq.published,status.eq.active,status.is.null")
          .maybeSingle();
        course = result.data;
        courseError = result.error;
      }

      if (courseError) {
        console.error("[apprenant] Error fetching course:", {
          error: courseError,
          message: courseError?.message,
          code: courseError?.code,
          details: courseError?.details,
          hint: courseError?.hint,
          slug,
        });
        return null;
      }

      if (!course) {
        console.error("[apprenant] Course not found for slug/id:", slug);
    return null;
  }

      console.log("[apprenant] Course found:", { id: course.id, title: course.title, slug: course.slug });

      // Parser le builder_snapshot pour extraire la structure
      let snapshot: any = null;
      if (course.builder_snapshot) {
        try {
          snapshot = typeof course.builder_snapshot === 'string'
            ? JSON.parse(course.builder_snapshot)
            : course.builder_snapshot;
        } catch (e) {
          console.error("[apprenant] Error parsing builder_snapshot:", e);
        }
      }

      // Transformer les sections en modules avec lessons
      const modules: LearnerModule[] = [];
      if (snapshot?.sections && Array.isArray(snapshot.sections)) {
        snapshot.sections.forEach((section: any) => {
          const lessons: LearnerLesson[] = [];
          
          // Parcourir les chapitres et sous-chapitres pour créer les lessons
          if (section.chapters && Array.isArray(section.chapters)) {
            section.chapters.forEach((chapter: any) => {
              // Le chapitre lui-même peut être une lesson s'il a du contenu ou un titre
              if (chapter.content || chapter.title || chapter.videoUrl || chapter.mediaUrl) {
                const chapterId = chapter.id || `chapter-${chapter.title || Date.now()}`;
                lessons.push({
                  id: chapterId,
                  title: chapter.title || "Sans titre",
                  type: chapter.type || (chapter.videoUrl || chapter.mediaUrl ? "video" : "document"),
                  description: chapter.content || chapter.description || chapter.summary,
                  videoUrl: chapter.videoUrl || chapter.mediaUrl || chapter.trailerUrl,
                  duration: chapter.duration || "5 min",
                  kind: "chapter",
                  dbChapterId: chapter.dbId ? String(chapter.dbId) : null,
                });
              }
              
              // Les sous-chapitres sont aussi des lessons
              if (chapter.subchapters && Array.isArray(chapter.subchapters)) {
                chapter.subchapters.forEach((subchapter: any) => {
                  const isInterview = subchapter.kind === "experiential_interview";
                  let interviewContext =
                    typeof subchapter.interview_context === "string"
                      ? subchapter.interview_context.trim()
                      : "";
                  if (isInterview && !interviewContext) {
                    interviewContext = extractChapterPlainText(chapter as CourseBuilderChapter).slice(0, 14_000);
                  }
                  const interviewObjectives =
                    typeof subchapter.interview_objectives === "string"
                      ? subchapter.interview_objectives.trim()
                      : "";
                  const hasInterviewContext = interviewContext.length > 0;
                  if (
                    subchapter.content ||
                    subchapter.title ||
                    subchapter.videoUrl ||
                    subchapter.mediaUrl ||
                    isInterview ||
                    hasInterviewContext
                  ) {
                    const isQuiz = subchapter.kind === "quiz" || Boolean(subchapter.quiz_id);
                    lessons.push({
                      id: subchapter.id || `subchapter-${subchapter.title || Date.now()}`,
                      title: subchapter.title || "Sans titre",
                      type: subchapter.type || (subchapter.videoUrl || subchapter.mediaUrl ? "video" : "document"),
                      description: isInterview ? "" : subchapter.content || subchapter.description,
                      videoUrl: subchapter.videoUrl || subchapter.mediaUrl,
                      duration: subchapter.duration || "3 min",
                      kind: isQuiz ? "quiz" : isInterview ? "experiential_interview" : "subchapter",
                      parentChapterId: chapter.id || undefined,
                      quiz_id: subchapter.quiz_id ? String(subchapter.quiz_id) : undefined,
                      interview_context: hasInterviewContext ? interviewContext : undefined,
                      interview_objectives: interviewObjectives || undefined,
                    });
                  }
                });
              }
            });
          }

          // Ne créer un module que s'il y a des lessons
          if (lessons.length > 0 || section.title) {
            modules.push({
              id: section.id || `section-${section.title || Date.now()}`,
              title: section.title || "Section",
              lessons: lessons.length > 0 ? lessons : undefined,
            });
          }
        });
      }

      // Récupérer les tests assignés à cette formation via course_tests
      const { data: courseTests, error: courseTestsError } = await supabase
        .from("course_tests")
        .select(`
          test_id,
          section_id,
          chapter_id,
          subchapter_id,
          local_section_id,
          local_chapter_id,
          local_subchapter_id,
          local_position_after_id,
          position_after_id,
          position_type,
          order_index,
          tests (
            id,
            title,
            description,
            slug,
            duration,
            status
          )
        `)
        .eq("course_id", course.id)
        .order("order_index", { ascending: true });

      if (!courseTestsError && courseTests && courseTests.length > 0) {
        // Ajouter les tests aux modules appropriés
        courseTests.forEach((courseTest: any) => {
          const test = courseTest.tests;
          if (!test || test.status !== "published") return;

          const testLesson: LearnerLesson = {
            id: `test-${test.id}`,
            title: test.title || "Test",
            type: "test",
            description: test.description || null,
            duration: test.duration || "10 min",
            kind: "test" as any,
            // Le href sera construit par lessonHref dans le composant pour rester dans le contexte de la formation
          } as LearnerLesson & { href?: string };

          // Utiliser les IDs locaux (nanoids) pour le positionnement dans le builder_snapshot
          // Les IDs locaux correspondent aux IDs dans le snapshot JSON
          const targetSectionId = courseTest.local_section_id || courseTest.section_id;
          const targetChapterId = courseTest.local_chapter_id || courseTest.chapter_id;
          const targetSubchapterId = courseTest.local_subchapter_id || courseTest.subchapter_id;
          const targetPositionAfterId = courseTest.local_position_after_id || courseTest.position_after_id;

          // Si le test est assigné à une section spécifique
          if (targetSectionId) {
            const targetModule = modules.find((m) => m.id === targetSectionId);
            if (targetModule) {
              // Si assigné à un chapitre spécifique
              if (targetChapterId) {
                // Trouver la lesson correspondant au chapitre
                const chapterIndex = targetModule.lessons?.findIndex(
                  (l) => l.id === targetChapterId
                );
                if (chapterIndex !== undefined && chapterIndex >= 0 && targetModule.lessons) {
                  // Si positionné après un élément spécifique
                  if (targetPositionAfterId) {
                    const afterIndex = targetModule.lessons.findIndex(
                      (l) => l.id === targetPositionAfterId
                    );
                    if (afterIndex >= 0) {
                      targetModule.lessons.splice(afterIndex + 1, 0, testLesson);
                    } else {
                      // Insérer après le chapitre
                      targetModule.lessons.splice(chapterIndex + 1, 0, testLesson);
                    }
                  } else {
                    // Insérer après le chapitre
                    targetModule.lessons.splice(chapterIndex + 1, 0, testLesson);
                  }
                } else if (targetSubchapterId) {
                  // Si assigné à un sous-chapitre, trouver le sous-chapitre
                  const subchapterIndex = targetModule.lessons?.findIndex(
                    (l) => l.id === targetSubchapterId
                  );
                  if (subchapterIndex !== undefined && subchapterIndex >= 0 && targetModule.lessons) {
                    if (targetPositionAfterId) {
                      const afterIndex = targetModule.lessons.findIndex(
                        (l) => l.id === targetPositionAfterId
                      );
                      if (afterIndex >= 0) {
                        targetModule.lessons.splice(afterIndex + 1, 0, testLesson);
                      } else {
                        targetModule.lessons.splice(subchapterIndex + 1, 0, testLesson);
                      }
                    } else {
                      targetModule.lessons.splice(subchapterIndex + 1, 0, testLesson);
                    }
                  } else {
                    // Ajouter à la fin du module
                    if (!targetModule.lessons) targetModule.lessons = [];
                    targetModule.lessons.push(testLesson);
                  }
                } else {
                  // Ajouter à la fin du module
                  if (!targetModule.lessons) targetModule.lessons = [];
                  targetModule.lessons.push(testLesson);
                }
              } else {
                // Test assigné à la section mais pas à un chapitre spécifique
                if (!targetModule.lessons) targetModule.lessons = [];
                if (targetPositionAfterId) {
                  const afterIndex = targetModule.lessons.findIndex(
                    (l) => l.id === targetPositionAfterId
                  );
                  if (afterIndex >= 0) {
                    targetModule.lessons.splice(afterIndex + 1, 0, testLesson);
                  } else {
                    // Ajouter selon order_index ou à la fin
                    if (courseTest.order_index !== undefined && courseTest.order_index < targetModule.lessons.length) {
                      targetModule.lessons.splice(courseTest.order_index, 0, testLesson);
                    } else {
                      targetModule.lessons.push(testLesson);
                    }
                  }
                } else {
                  // Ajouter selon order_index ou à la fin
                  if (courseTest.order_index !== undefined && courseTest.order_index < targetModule.lessons.length) {
                    targetModule.lessons.splice(courseTest.order_index, 0, testLesson);
                  } else {
                    targetModule.lessons.push(testLesson);
                  }
                }
              }
            } else {
              // Si la section n'existe pas dans le snapshot, ajouter au premier module ou créer un module "Tests"
              if (modules.length > 0) {
                if (!modules[0].lessons) modules[0].lessons = [];
                modules[0].lessons.push(testLesson);
              } else {
                modules.push({
                  id: "tests",
                  title: "Tests",
                  lessons: [testLesson],
                });
              }
            }
          } else {
            // Test assigné au cours sans section spécifique - créer un module "Tests" ou ajouter au premier module
            let testsModule = modules.find((m) => m.id === "tests" || m.title === "Tests");
            if (!testsModule) {
              testsModule = {
                id: "tests",
                title: "Tests",
                lessons: [],
              };
              modules.push(testsModule);
            }
            if (!testsModule.lessons) testsModule.lessons = [];
            if (targetPositionAfterId) {
              const afterIndex = testsModule.lessons.findIndex(
                (l) => l.id === targetPositionAfterId
              );
              if (afterIndex >= 0) {
                testsModule.lessons.splice(afterIndex + 1, 0, testLesson);
              } else {
                testsModule.lessons.push(testLesson);
              }
            } else if (courseTest.order_index !== undefined && courseTest.order_index < testsModule.lessons.length) {
              testsModule.lessons.splice(courseTest.order_index, 0, testLesson);
            } else {
              testsModule.lessons.push(testLesson);
            }
          }
        });
      }

      // Si pas de modules depuis builder_snapshot, créer un module par défaut
      if (modules.length === 0) {
        modules.push({
          id: "default",
          title: "Contenu",
          lessons: [],
        });
      }

      // Charger les flashcards du cours depuis la base de données (best-effort).
      // Si la table n'existe pas (environnement minimal), on ignore silencieusement.
      let { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("*")
        .eq("course_id", course.id)
        .order("created_at", { ascending: true });

      const flashcardsErrorMessage = String((flashcardsError as any)?.message ?? "");
      const flashcardsErrorCode = String((flashcardsError as any)?.code ?? "");
      const isMissingFlashcardsTable =
        flashcardsErrorCode === "42P01" ||
        flashcardsErrorMessage.toLowerCase().includes('relation "flashcards" does not exist') ||
        flashcardsErrorMessage.toLowerCase().includes("relation does not exist");

      if (isMissingFlashcardsTable) {
        flashcardsData = [];
        flashcardsError = null as any;
      } else if (flashcardsError) {
        console.error("[apprenant] Error loading flashcards:", JSON.stringify(flashcardsError));
      }

      // Construire un mapping des IDs de chapitres depuis le snapshot
      const chapterIdMap = new Map<string, string>(); // dbId -> localId
      const localIdMap = new Map<string, string>(); // localId -> dbId
      
      if (course.builder_snapshot) {
        const snapshot = course.builder_snapshot as any;
        for (const section of snapshot.sections || []) {
          for (const chapter of section.chapters || []) {
            if (chapter.dbId && chapter.id) {
              chapterIdMap.set(chapter.dbId, chapter.id);
              localIdMap.set(chapter.id, chapter.dbId);
            }
            // Vérifier aussi les sous-chapitres
            if (chapter.subchapters) {
              for (const subchapter of chapter.subchapters) {
                if (subchapter.dbId && subchapter.id) {
                  chapterIdMap.set(subchapter.dbId, subchapter.id);
                  localIdMap.set(subchapter.id, subchapter.dbId);
                }
              }
            }
          }
        }
      }

      console.log("[apprenant] Chapter ID mapping:", JSON.stringify({
        chapterIdMap: Array.from(chapterIdMap.entries()),
        localIdMap: Array.from(localIdMap.entries())
      }));

      // Mapper les flashcards aux lessons appropriées (chapter_id UUID et/ou local_chapter_ref builder)
      if (flashcardsData && flashcardsData.length > 0) {
        flashcardsData.forEach((flashcard) => {
          const row = flashcard as Record<string, unknown>;
          const learnerFlashcard: LearnerFlashcard = {
            id: String(row.id ?? ""),
            front: String(row.front ?? row.question ?? row.title ?? ""),
            back: String(row.back ?? row.answer ?? row.body ?? ""),
          };

          const dbChapterId =
            row.chapter_id != null && String(row.chapter_id).trim() !== ""
              ? String(row.chapter_id)
              : null;
          const localChapterRef =
            row.local_chapter_ref != null && String(row.local_chapter_ref).trim() !== ""
              ? String(row.local_chapter_ref).trim()
              : null;

          const pushToLesson = (lesson: LearnerLesson) => {
            const lessonWithFlashcards = lesson as LearnerLesson & { flashcards?: LearnerFlashcard[] };
            if (!lessonWithFlashcards.flashcards) {
              lessonWithFlashcards.flashcards = [];
            }
            lessonWithFlashcards.flashcards.push(learnerFlashcard);
          };

          let matched = false;

          if (dbChapterId) {
            modules.forEach((module) => {
              module.lessons?.forEach((lesson) => {
                if (lesson.id === dbChapterId) {
                  pushToLesson(lesson);
                  matched = true;
                  console.log("[apprenant] Flashcard matched directly:", JSON.stringify({
                    flashcardId: flashcard.id,
                    chapterId: dbChapterId,
                    lessonId: lesson.id,
                  }));
                } else {
                  const localId = chapterIdMap.get(dbChapterId);
                  if (localId && lesson.id === localId) {
                    pushToLesson(lesson);
                    matched = true;
                    console.log("[apprenant] Flashcard matched via dbId mapping:", JSON.stringify({
                      flashcardId: flashcard.id,
                      chapterId: dbChapterId,
                      localId,
                      lessonId: lesson.id,
                    }));
                  }
                }
              });
            });

            if (!matched) {
              console.warn("[apprenant] Flashcard not matched to any lesson:", JSON.stringify({
                flashcardId: flashcard.id,
                chapterId: dbChapterId,
                localChapterRef,
                availableLessonIds: modules.flatMap((m) => m.lessons?.map((l) => l.id) || []),
              }));
            }
          } else if (localChapterRef) {
            modules.forEach((module) => {
              module.lessons?.forEach((lesson) => {
                if (lesson.id === localChapterRef) {
                  pushToLesson(lesson);
                  matched = true;
                  console.log("[apprenant] Flashcard matched via local_chapter_ref:", JSON.stringify({
                    flashcardId: flashcard.id,
                    localChapterRef,
                    lessonId: lesson.id,
                  }));
                }
              });
            });

            if (!matched) {
              console.warn("[apprenant] Flashcard not matched (local_chapter_ref inconnu dans le snapshot):", JSON.stringify({
                flashcardId: flashcard.id,
                localChapterRef,
                availableLessonIds: modules.flatMap((m) => m.lessons?.map((l) => l.id) || []),
              }));
            }
          } else {
            console.warn(
              "[apprenant] Flashcard ignorée (chapter_id et local_chapter_ref absents):",
              JSON.stringify({ flashcardId: flashcard.id }),
            );
          }
        });
      }
      
      // Log final pour vérifier
      const totalFlashcards = modules.reduce((sum, module) => {
        return sum + (module.lessons?.reduce((lessonSum, lesson) => {
          return lessonSum + ((lesson as any).flashcards?.length || 0);
        }, 0) || 0);
      }, 0);
      console.log("[apprenant] Total flashcards mapped to lessons:", JSON.stringify({ total: totalFlashcards }));

      const peerIdRaw = (course as { validated_by_peer_id?: string | null }).validated_by_peer_id;
      const validatedByPeerId =
        peerIdRaw != null && String(peerIdRaw).trim() !== "" ? String(peerIdRaw).trim() : null;

      let validatorForBadge: { name: string; professional_title: string; photo_url?: string } | null = null;
      if (validatedByPeerId) {
        try {
          const vdb = getServiceRoleClient() ?? supabase;
          const { data: vRow } = await vdb.from("validators").select("*").eq("id", validatedByPeerId).maybeSingle();
          validatorForBadge = mapValidatorRowToBadgeForCatalog((vRow ?? null) as Record<string, unknown> | null);
        } catch {
          /* ignore */
        }
      }

      // Construire la card
      const card: LearnerCard = {
        id: course.id,
        title: snapshot?.general?.title || course.title,
        slug: course.slug || course.id,
        href: `/catalog/formations/${course.slug || course.id}`,
        image: snapshot?.general?.heroImage || course.cover_image,
        meta: snapshot?.general?.subtitle || course.description || null,
        progress: null,
      };

      // Extraire les objectifs et compétences depuis le snapshot
      const objectives = snapshot?.objectives || [];
      const skills = snapshot?.skills || [];
      const trailerUrl = snapshot?.general?.trailerUrl || null;
      const presentation =
        (snapshot as any)?.presentation ??
        (snapshot as any)?.general?.presentation ??
        (snapshot as any)?.general?.description ??
        course.presentation ??
        null;

      // Construire le detail
      const detail: LearnerDetail = {
        title: snapshot?.general?.title || course.title,
        subtitle: snapshot?.general?.subtitle || course.description || null,
        backgroundImage: snapshot?.general?.heroImage || course.cover_image || "",
        badge: snapshot?.general?.badge ? {
          label: snapshot.general.badge.title || snapshot.general.badge.label || "Badge",
          description: snapshot.general.badge.description,
        } : null,
        meta: [
          snapshot?.general?.duration || "Durée à déterminer",
          snapshot?.general?.level || "Tous niveaux",
        ],
        modules,
        objectives,
        skills,
        trailerUrl,
        // Champs additionnels (best-effort) pour UI premium catalog.
        ...(presentation ? ({ presentation } as any) : {}),
        ...(snapshot ? ({ builder_snapshot: snapshot } as any) : {}),
        description: snapshot?.general?.description || course.description || "",
        tags: snapshot?.general?.tags || ["Formation"],
        validatedByPeerId,
        validatorForBadge,
      };

      return { card, detail };
    }

    if (category === "tests") {
      console.log("[apprenant] Fetching test with slug/id:", slug);

      const selectColumns =
        "id, slug, title, description, cover_image, duration, evaluation_type, display_format, skills";

      let { data: test, error: testError } = await supabase
        .from("tests")
        .select(selectColumns)
        .eq("slug", slug)
        .maybeSingle();

      if (!test && !testError && slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log("[apprenant] Slug looks like UUID, trying by ID:", slug);
        const result = await supabase.from("tests").select(selectColumns).eq("id", slug).maybeSingle();
        test = result.data;
        testError = result.error;
      }

      if (testError) {
        console.error("[apprenant] Error fetching test:", {
          code: testError?.code,
          message: testError?.message,
          details: testError?.details,
          hint: testError?.hint,
          slug,
        });
        return null;
      }

      if (!test) {
        console.error("[apprenant] Test not found for slug/id:", slug);
        return null;
      }

      const heroImage = test.cover_image || "";
      const testSlug = test.slug || test.id;
      const skills =
        typeof test.skills === "string"
          ? test.skills
              .split(",")
              .map((skill) => skill.trim())
              .filter(Boolean)
          : Array.isArray(test.skills)
            ? test.skills
            : [];

      const card: LearnerCard = {
        id: test.id,
        title: test.title,
        slug: testSlug,
        href: `/dashboard/student/learning/tests/${testSlug}`,
        image: heroImage,
        meta: test.display_format || "Test interactif",
      };

      const detail: LearnerDetail = {
        title: test.title,
        subtitle: test.display_format || "Diagnostic immersif",
        backgroundImage: heroImage,
        meta: [test.duration || "Durée ~20 min", test.evaluation_type || "Auto-évaluation guidée"],
        modules: [
          { id: "diagnostic", title: "Diagnostic des 10 dimensions soft skills", length: "40 items" },
          { id: "classement", title: "Classement personnalisé & analyse IA", length: "Synthèse immédiate" },
        ],
        objectives: [
          "Identifier vos atouts soft skills prioritaires",
          "Repérer les axes d’amélioration concrets",
          "Inspirer un plan d’action Beyond Care",
        ],
        skills,
        trailerUrl: null,
        description: test.description ?? "Diagnostic complet de vos soft skills naturels.",
        tags: ["Soft skills", "Diagnostic IA", "Beyond Care"],
      };

      return { card, detail };
    }

    // Pour les autres catégories, retourner null pour l'instant
    return null;
  } catch (error) {
    console.error("[apprenant] Error in getLearnerContentDetail:", error);
    return null;
  }
}

export async function getLearnerPathDetail(pathId: string): Promise<PathContentDetail | null> {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) return null;

  try {
    const runPathSelect = async (select: string) => {
      return await supabase.from("paths").select(select).eq("id", pathId).maybeSingle();
    };

    // Schémas `paths` variables selon les environnements: cover_image/description peuvent ne pas exister.
    let pathRow: any | null = null;
    let pErr: any | null = null;
    {
      const res = await runPathSelect("id, title, cover_image, description, path_snapshot");
      pathRow = (res as any).data ?? null;
      pErr = (res as any).error ?? null;
    }
    if (pErr?.code === "PGRST204" || pErr?.code === "42703") {
      const res = await runPathSelect("id, title, description, path_snapshot");
      pathRow = (res as any).data ?? null;
      pErr = (res as any).error ?? null;
    }
    if (pErr?.code === "PGRST204" || pErr?.code === "42703") {
      const res = await runPathSelect("id, title, path_snapshot");
      pathRow = (res as any).data ?? null;
      pErr = (res as any).error ?? null;
    }

    if (pErr || !pathRow) return null;

    const snap = (pathRow as any).path_snapshot;
    const steps = Array.isArray(snap?.steps) ? snap.steps : [];
    const objectifs = Array.isArray((snap as any)?.objectifs)
      ? ((snap as any).objectifs as any[]).map((x) => String(x ?? "").trim()).filter(Boolean)
      : typeof (snap as any)?.objective === "string"
        ? [String((snap as any).objective).trim()].filter(Boolean)
        : [];
    const tools = Array.isArray((snap as any)?.tools)
      ? ((snap as any).tools as any[]).map((x) => String(x ?? "").trim()).filter(Boolean)
      : [];
    const presentation =
      (typeof (snap as any)?.presentation === "string" && String((snap as any).presentation).trim()) ||
      (typeof (pathRow as any)?.description === "string" && String((pathRow as any).description).trim()) ||
      null;
    const cover_image =
      (typeof (snap as any)?.cover_image === "string" && String((snap as any).cover_image).trim()) ||
      (typeof (pathRow as any)?.cover_image === "string" && String((pathRow as any).cover_image).trim()) ||
      null;
    const title =
      (typeof (snap as any)?.title === "string" && String((snap as any).title).trim()) ||
      (typeof (pathRow as any)?.title === "string" && String((pathRow as any).title).trim()) ||
      null;

    const normalizeKind = (raw: unknown) => {
      const k = String(raw ?? "").trim().toLowerCase();
      if (k === "formation" || k === "formations") return "course";
      if (k === "cours" || k === "course" || k === "courses") return "course";
      if (k === "test" || k === "quiz" || k === "tests") return "test";
      if (k === "resource" || k === "resources" || k === "ressource" || k === "ressources") return "resource";
      return k;
    };
    const normalizeId = (raw: unknown) => String(raw ?? "").trim();
    const kindOfStep = (s: any) => normalizeKind(s?.content_kind ?? s?.contentKind ?? s?.kind);
    const idOfStep = (s: any) => normalizeId(s?.content_id ?? s?.contentId ?? s?.id);

    const courseIds = Array.from(
      new Set(
        steps
          .filter((s: any) => kindOfStep(s) === "course" && idOfStep(s))
          .map((s: any) => idOfStep(s)),
      ),
    );
    const testIds = Array.from(
      new Set(
        steps
          .filter((s: any) => kindOfStep(s) === "test" && idOfStep(s))
          .map((s: any) => idOfStep(s)),
      ),
    );
    const resourceIds = Array.from(
      new Set(
        steps
          .filter((s: any) => kindOfStep(s) === "resource" && idOfStep(s))
          .map((s: any) => idOfStep(s)),
      ),
    );

    const fetchByIds = async (table: "courses" | "tests" | "resources", ids: string[]) => {
      if (ids.length === 0) return [] as any[];
      // try with slug, then without
      let res: any =
        table === "courses"
          ? await supabase
              .from(table)
              .select("id, title, slug, cover_image, hero_image_url, image_url, builder_snapshot")
              .in("id", ids)
              .limit(300)
          : await supabase.from(table).select("id, title, slug").in("id", ids).limit(300);
      if (res?.error?.code === "42703" || res?.error?.code === "PGRST204") {
        res =
          table === "courses"
            ? await supabase.from(table).select("id, title, cover_image, hero_image_url, image_url, builder_snapshot").in("id", ids).limit(300)
            : await supabase.from(table).select("id, title").in("id", ids).limit(300);
      }
      return Array.isArray(res?.data) ? (res.data as any[]) : [];
    };

    const [coursesRows, testsRows, resourcesRows] = await Promise.all([
      fetchByIds("courses", courseIds),
      fetchByIds("tests", testIds),
      fetchByIds("resources", resourceIds),
    ]);

    const mapRows = (table: "courses" | "tests" | "resources", rows: any[], ids: string[]) => {
      const byId = new Map(rows.map((r) => [String(r.id), r]));
      return ids.map((id) => {
        const r = byId.get(String(id));
        const title = String(r?.title ?? "Contenu").trim() || "Contenu";
        const slug = String(r?.slug ?? id).trim() || String(id);
        const cover_url =
          table === "courses"
            ? String(
                (r as any)?.cover_image ??
                  (r as any)?.hero_image_url ??
                  (r as any)?.image_url ??
                  (r as any)?.builder_snapshot?.general?.heroImage ??
                  "",
              ).trim() || null
            : null;
        return { id: String(id), title, slug, ...(cover_url ? { cover_url } : {}) };
      });
    };

    return {
      steps,
      title,
      cover_image,
      presentation,
      tools,
      objectifs,
      courses: mapRows("courses", coursesRows, courseIds),
      tests: mapRows("tests", testsRows, testIds),
      resources: mapRows("resources", resourcesRows, resourceIds),
    };
  } catch (e) {
    console.warn("[apprenant] getLearnerPathDetail failed:", e);
    return null;
  }
}

export async function getCourseBySlug(slug: string): Promise<any | null> {
  // TODO: Implémenter complètement cette fonction
  return null;
}
