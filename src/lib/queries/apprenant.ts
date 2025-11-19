import { getServerClient } from "@/lib/supabase/server";

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
  meta?: string | null;
  category?: string | null;
  cta?: string | null;
  progress?: number | null;
};

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
};

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
  kind?: "chapter" | "subchapter";
  parentChapterId?: string;
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
};

export type PathContentDetail = {
  courses: Array<{ id: string; title: string; slug: string }>;
  tests: Array<{ id: string; title: string; slug: string }>;
  resources: Array<{ id: string; title: string; slug: string }>;
};

export type LearnerCategory = "formations" | "parcours" | "ressources" | "tests";

export function isLearnerCategory(category: string): category is LearnerCategory {
  return ["formations", "parcours", "ressources", "tests"].includes(category);
}

// Fonctions stub pour éviter les erreurs de build (à implémenter complètement après)
export async function getApprenantDashboardData(): Promise<ApprenantDashboardData> {
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
      };
    }

    // Récupérer les formations assignées via enrollments
    // La table enrollments peut avoir user_id OU learner_id
    let formations: LearnerCard[] = [];
    
    try {
      // Essayer d'abord avec enrollments (sans colonnes qui pourraient ne pas exister)
      const { data: enrollments, error: enrollError } = await supabase
        .from("enrollments")
        .select(`
          course_id,
          courses (
            id,
            title,
            description,
            slug,
            cover_image,
            hero_image_url,
            thumbnail_url,
            builder_snapshot,
            status,
            creator_id,
            category
          )
        `)
        .or(`user_id.eq.${user.id},learner_id.eq.${user.id}`);

      if (enrollError) {
        console.error("[apprenant] Error fetching enrollments:", enrollError);
        console.error("[apprenant] Error code:", enrollError.code);
        console.error("[apprenant] Error message:", enrollError.message);
        console.error("[apprenant] Error details:", JSON.stringify(enrollError, null, 2));
      } else if (enrollments && enrollments.length > 0) {
        console.log("[apprenant] Found enrollments:", enrollments.length);
        for (const enrollment of enrollments) {
          const course = (enrollment as any).courses;
          if (course) {
            // Vérifier si le cours est publié via status (pas de colonne published)
            const isPublished = course.status === "published" || course.status === "active" || !course.status || course.status === null;
            console.log("[apprenant] Processing course:", course.id, course.title, "status:", course.status, "isPublished:", isPublished);
            if (isPublished) {
              formations.push({
                id: course.id,
                title: course.title || "Formation sans titre",
                slug: course.slug || course.id,
                href: `/catalog/formations/${course.slug || course.id}`,
                // Utiliser seulement les colonnes qui existent
                image: course.cover_image || course.hero_image_url || course.thumbnail_url || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
                meta: course.description || null,
                category: course.category || null,
                cta: "Continuer",
              });
            }
          } else {
            console.warn("[apprenant] Enrollment without course:", enrollment.course_id);
          }
        }
      } else {
        console.log("[apprenant] No enrollments found for user:", user.id);
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
        const { data: enrollmentIds, error: idsError } = await supabase
          .from("enrollments")
          .select("course_id")
          .or(`user_id.eq.${user.id},learner_id.eq.${user.id}`);

        if (!idsError && enrollmentIds && enrollmentIds.length > 0) {
          const courseIds = enrollmentIds.map(e => e.course_id).filter(Boolean);
          console.log("[apprenant] Found course_ids from enrollments:", courseIds);

          // Récupérer les courses directement (sans colonnes qui pourraient ne pas exister)
          // Essayer d'abord avec les colonnes de base
          let courses: any[] = [];
          let coursesError: any = null;
          
          // Essayer avec les colonnes de base (sans published qui n'existe peut-être pas)
          const { data: coursesData, error: coursesErr } = await supabase
            .from("courses")
            .select("id, title, description, slug, cover_image, hero_image_url, thumbnail_url, builder_snapshot, status, creator_id, category")
            .in("id", courseIds);
          
          if (coursesErr) {
            console.error("[apprenant] Error fetching courses with base columns:", coursesErr);
            // Essayer avec encore moins de colonnes
            const { data: coursesMinimal, error: coursesMinErr } = await supabase
              .from("courses")
              .select("id, title, description, slug, status")
              .in("id", courseIds);
            
            if (coursesMinErr) {
              coursesError = coursesMinErr;
              console.error("[apprenant] Error fetching courses with minimal columns:", coursesMinErr);
            } else {
              courses = coursesMinimal || [];
            }
          } else {
            courses = coursesData || [];
          }

          if (coursesError) {
            console.error("[apprenant] Error fetching courses directly:", coursesError);
            console.error("[apprenant] Error code:", coursesError.code);
            console.error("[apprenant] Error message:", coursesError.message);
          } else if (courses && courses.length > 0) {
            console.log("[apprenant] Found courses directly:", courses.length);
            // Filtrer par status si disponible, sinon prendre tous
            const publishedCourses = courses.filter((course: any) => {
              const isPublished = course.status === "published" || course.status === "active" || !course.status || course.status === null;
              return isPublished;
            });
            console.log("[apprenant] Published courses after filtering:", publishedCourses.length);
            formations = publishedCourses.map((course: any) => ({
              id: course.id,
              title: course.title || "Formation sans titre",
              slug: course.slug || course.id,
              href: `/catalog/formations/${course.slug || course.id}`,
              // Utiliser seulement les colonnes qui existent
              image: course.cover_image || course.hero_image_url || course.thumbnail_url || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
              meta: course.description || null,
              category: course.category || null,
              cta: "Continuer",
            }));
          }
        }
      } catch (error) {
        console.error("[apprenant] Exception in direct course fetch:", error);
      }
    }
    
    console.log("[apprenant] Total formations found:", formations.length);

    // Récupérer les parcours assignés via path_progress
    const { data: pathProgress, error: pathError } = await supabase
      .from("path_progress")
      .select(`
        path_id,
        paths (
          id,
          title,
          description,
          slug,
          cover_image,
          hero_image_url,
          thumbnail_url,
          status,
          published,
          creator_id
        )
      `)
      .eq("user_id", user.id);

    const parcours: LearnerCard[] = [];
    if (!pathError && pathProgress) {
      console.log("[apprenant] path_progress rows", pathProgress.length, pathProgress);
      for (const progress of pathProgress) {
        const path = (progress as any).paths;
        if (path) {
          console.log("[apprenant] processing path", path.id, path.title, path.status);
          parcours.push({
            id: path.id,
            title: path.title || "Parcours sans titre",
            slug: path.slug || path.id,
            href: `/dashboard/apprenant/parcours/${path.slug || path.id}`,
            image: path.hero_image_url || path.cover_image || path.thumbnail_url || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
            meta: path.description || (path.published ? null : "Parcours en cours de préparation"),
            cta: "Continuer",
          });
        }
      }
    }

    // Récupérer les ressources assignées via content_assignments ou resource_views
    const { data: resourceViews, error: resourceError } = await supabase
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
          thumbnail_url,
          published,
          creator_id
        )
      `)
      .eq("user_id", user.id)
      .limit(10);

    const ressources: LearnerCard[] = [];
    if (!resourceError && resourceViews) {
      for (const view of resourceViews) {
        const resource = (view as any).resources;
        if (resource && resource.published) {
          ressources.push({
            id: resource.id,
            title: resource.title || "Ressource sans titre",
            slug: resource.id,
            href: `/dashboard/apprenant/ressources/${resource.id}`,
            image: resource.cover_url || resource.thumbnail_url || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=1200&q=80",
            meta: resource.description || null,
            cta: "Consulter",
          });
        }
      }
    }

    // Récupérer les tests assignés (via content_assignments ou test_attempts)
    const { data: testAttempts, error: testError } = await supabase
      .from("test_attempts")
      .select(`
        test_id,
        tests (
          id,
          title,
          description,
          cover_image,
          hero_image_url,
          thumbnail_url,
          published,
          creator_id
        )
      `)
      .eq("user_id", user.id)
      .limit(10);

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
            href: `/dashboard/tests/${test.slug || test.id}`,
            image: test.hero_image_url || test.cover_image || test.thumbnail_url || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
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
            hero_image_url,
            cover_image,
            thumbnail_url
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
              href: `/dashboard/tests/${test.slug || test.id}`,
              image: test.hero_image_url || test.cover_image || test.thumbnail_url || "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=1200&q=80",
              meta: test.description || null,
              cta: "Passer le test",
            });
            testIdsInAttempts.add(test.id);
          }
        }
      }
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
        .select("id, title, description, slug, cover_image, hero_image_url, thumbnail_url, builder_snapshot, status")
        .eq("slug", slug)
        .maybeSingle();

      // Si pas trouvé par slug, essayer par ID
      if (!course && !courseError && slug.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        console.log("[apprenant] Slug looks like UUID, trying by ID:", slug);
        const result = await supabase
          .from("courses")
          .select("id, title, description, slug, cover_image, hero_image_url, thumbnail_url, builder_snapshot, status")
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
          .select("id, title, description, slug, cover_image, hero_image_url, thumbnail_url, builder_snapshot, status")
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
                });
              }
              
              // Les sous-chapitres sont aussi des lessons
              if (chapter.subchapters && Array.isArray(chapter.subchapters)) {
                chapter.subchapters.forEach((subchapter: any) => {
                  if (subchapter.content || subchapter.title || subchapter.videoUrl || subchapter.mediaUrl) {
                    lessons.push({
                      id: subchapter.id || `subchapter-${subchapter.title || Date.now()}`,
                      title: subchapter.title || "Sans titre",
                      type: subchapter.type || (subchapter.videoUrl || subchapter.mediaUrl ? "video" : "document"),
                      description: subchapter.content || subchapter.description,
                      videoUrl: subchapter.videoUrl || subchapter.mediaUrl,
                      duration: subchapter.duration || "3 min",
                      kind: "subchapter",
                      parentChapterId: chapter.id || undefined,
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

      // Charger les flashcards du cours depuis la base de données
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from("flashcards")
        .select("id, front, back, course_id, chapter_id")
        .eq("course_id", course.id)
        .order("created_at", { ascending: true });

      if (flashcardsError) {
        console.error("[apprenant] Error loading flashcards:", flashcardsError);
      }

      // Mapper les flashcards aux lessons appropriées
      if (flashcardsData && flashcardsData.length > 0) {
        flashcardsData.forEach((flashcard) => {
          const learnerFlashcard: LearnerFlashcard = {
            id: flashcard.id,
            front: flashcard.front,
            back: flashcard.back,
          };

          // Si la flashcard est associée à un chapitre spécifique
          if (flashcard.chapter_id) {
            // Trouver toutes les lessons qui correspondent à ce chapter_id
            modules.forEach((module) => {
              module.lessons?.forEach((lesson) => {
                if (lesson.id === flashcard.chapter_id || lesson.parentChapterId === flashcard.chapter_id) {
                  const lessonWithFlashcards = lesson as LearnerLesson & { flashcards?: LearnerFlashcard[] };
                  if (!lessonWithFlashcards.flashcards) {
                    lessonWithFlashcards.flashcards = [];
                  }
                  lessonWithFlashcards.flashcards.push(learnerFlashcard);
                }
              });
            });
          } else {
            // Flashcard associée au cours entier, l'ajouter à toutes les lessons
            modules.forEach((module) => {
              module.lessons?.forEach((lesson) => {
                const lessonWithFlashcards = lesson as LearnerLesson & { flashcards?: LearnerFlashcard[] };
                if (!lessonWithFlashcards.flashcards) {
                  lessonWithFlashcards.flashcards = [];
                }
                lessonWithFlashcards.flashcards.push(learnerFlashcard);
              });
            });
          }
        });
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
        description: snapshot?.general?.description || course.description || "",
        tags: snapshot?.general?.tags || ["Formation"],
      };

      return { card, detail };
    }

    if (category === "tests") {
      console.log("[apprenant] Fetching test with slug/id:", slug);

      const selectColumns =
        "id, slug, title, description, hero_image_url, thumbnail_url, cover_image, duration, evaluation_type, display_format, skills";

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

      const heroImage = test.hero_image_url || test.thumbnail_url || test.cover_image || "";
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
        href: `/dashboard/tests/${testSlug}`,
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
  // TODO: Implémenter complètement cette fonction
  return null;
}

export async function getCourseBySlug(slug: string): Promise<any | null> {
  // TODO: Implémenter complètement cette fonction
  return null;
}
