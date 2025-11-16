import { randomUUID } from "crypto";

import { cloneCourseBuilderSnapshot } from "@/data/course-builder-fallback";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CourseBuilderSnapshot } from "@/types/course-builder";

export type FormateurKpis = {
  totalLearners: number;
  activeCourses: number;
  publishedTests: number;
  pendingReviews: number;
};

export type FormateurHighlight = {
  id: string;
  title: string;
  image: string;
  cta: string;
  href?: string;
};

export type FormateurDashboardData = {
  kpis: FormateurKpis;
  activeCourses: FormateurHighlight[];
  recommendedCourses: FormateurHighlight[];
  upcomingSessions: FormateurHighlight[];
  featuredTests: FormateurHighlight[];
  resources: FormateurHighlight[];
  paths: FormateurHighlight[];
};

type CourseRow = {
  id?: string | number | null;
  title?: string | null;
  cover_image?: string | null;
  status?: string | null;
};

type SessionRow = {
  id?: string | number | null;
  title?: string | null;
  cover_image?: string | null;
  starts_at?: string | null;
};

// Pas de fallback - on retourne des tableaux vides
const emptyDashboardData: FormateurDashboardData = {
  kpis: {
    totalLearners: 0,
    activeCourses: 0,
    publishedTests: 0,
    pendingReviews: 0,
  },
  activeCourses: [],
  recommendedCourses: [],
  upcomingSessions: [],
  featuredTests: [],
  resources: [],
  paths: [],
};

export const getFormateurDashboardData = async (): Promise<FormateurDashboardData> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable, returning empty data");
    return emptyDashboardData;
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      console.warn("[formateur] Auth error, returning empty data");
      return emptyDashboardData;
    }

    const userId = authData.user.id;

    // Récupérer les données du formateur uniquement
    const [enrollmentsResult, coursesResult, testsResult] = await Promise.all([
      supabase
        .from("enrollments")
        .select("user_id", { head: true, count: "exact" })
        .eq("role", "student"),
      supabase
        .from("courses")
        .select("id", { head: true, count: "exact" })
        .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
        .eq("status", "published"),
      supabase
        .from("tests")
        .select("id", { head: true, count: "exact" })
        .or(`created_by.eq.${userId},owner_id.eq.${userId}`)
        .eq("status", "published"),
    ]);

    if (enrollmentsResult.error) throw enrollmentsResult.error;
    if (coursesResult.error) throw coursesResult.error;
    if (testsResult.error) throw testsResult.error;

    const pendingReviewsResult = await supabase
      .from("assignments")
      .select("id", { head: true, count: "exact" })
      .eq("status", "pending_review");

    if (pendingReviewsResult.error) throw pendingReviewsResult.error;

    // Récupérer les formations du formateur (tous les statuts pour le dashboard)
    // Utiliser deux requêtes séparées au lieu de .or() pour éviter les problèmes RLS
    const [coursesByCreator, coursesByOwner] = await Promise.all([
      supabase
        .from("courses")
        .select("id, title, cover_image, status")
        .eq("creator_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("courses")
        .select("id, title, cover_image, status")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10),
    ]);

    // Combiner les résultats et dédupliquer
    const allCourses = [
      ...(coursesByCreator.data || []),
      ...(coursesByOwner.data || []),
    ];
    
    const uniqueCourses = Array.from(
      new Map(allCourses.map(c => [c.id, c])).values()
    ).slice(0, 6);

    console.log("[formateur] Courses found for dashboard:", {
      byCreator: coursesByCreator.data?.length || 0,
      byOwner: coursesByOwner.data?.length || 0,
      unique: uniqueCourses.length,
      courses: uniqueCourses.map(c => ({ id: c.id, title: c.title, status: c.status })),
      creatorError: coursesByCreator.error?.message,
      ownerError: coursesByOwner.error?.message,
    });

    const activeCoursesQuery = {
      data: uniqueCourses,
      error: coursesByCreator.error || coursesByOwner.error || null,
    };

    const sessionsQuery = await supabase
      .from("sessions")
      .select("id, title, cover_image, starts_at")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(6);

    if (sessionsQuery.error) throw sessionsQuery.error;

    // Récupérer les tests du formateur (tous les statuts pour le dashboard)
    const testsQuery = await supabase
      .from("tests")
      .select("id, title, status")
      .or(`created_by.eq.${userId},owner_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(6);

    if (testsQuery.error) throw testsQuery.error;

    // Récupérer les ressources du formateur
    const resourcesQuery = await supabase
      .from("resources")
      .select("id, title, cover_url, thumbnail_url, published")
      .or(`created_by.eq.${userId},owner_id.eq.${userId}`)
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(6);

    if (resourcesQuery.error) {
      console.warn("[formateur] Error fetching resources:", resourcesQuery.error);
    }

    // Récupérer les parcours du formateur
    const pathsQuery = await supabase
      .from("paths")
      .select("id, title, hero_url, thumbnail_url, status")
      .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
      .eq("status", "published")
      .order("updated_at", { ascending: false })
      .limit(6);

    if (pathsQuery.error) {
      console.warn("[formateur] Error fetching paths:", pathsQuery.error);
    }

    const mapCoursesToHighlights = (items?: CourseRow[] | null): FormateurHighlight[] => {
      if (!items || !items.length) return [];
      return items.map((item) => ({
        id: String(item.id ?? randomUUID()),
        title: item.title ?? "Formation",
        image: item.cover_image ?? "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
        cta: "Voir",
        href: `/dashboard/formateur/formations/${item.id}/structure`,
      }));
    };

    const mapSessionsToHighlights = (items?: SessionRow[] | null): FormateurHighlight[] => {
      if (!items || !items.length) return [];
      return items.map((item) => ({
        id: String(item.id ?? randomUUID()),
        title: item.title ?? "Session",
        image: item.cover_image ?? "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80",
        cta: "Voir",
      }));
    };

    const mapTestsToHighlights = (items?: any[] | null): FormateurHighlight[] => {
      if (!items || !items.length) return [];
      return items.map((item) => ({
        id: String(item.id ?? randomUUID()),
        title: item.title ?? "Test",
        image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=900&q=80",
        cta: "Voir",
        href: `/dashboard/formateur/tests/${item.id}/edit`,
      }));
    };

    const mapResourcesToHighlights = (items?: any[] | null): FormateurHighlight[] => {
      if (!items || !items.length) return [];
      return items.map((item) => ({
        id: String(item.id ?? randomUUID()),
        title: item.title ?? "Ressource",
        image: item.cover_url || item.thumbnail_url || "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80",
        cta: "Voir",
        href: `/dashboard/formateur/ressources/${item.id}`,
      }));
    };

    const mapPathsToHighlights = (items?: any[] | null): FormateurHighlight[] => {
      if (!items || !items.length) return [];
      return items.map((item) => ({
        id: String(item.id ?? randomUUID()),
        title: item.title ?? "Parcours",
        image: item.hero_url || item.thumbnail_url || "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=900&q=80",
        cta: "Voir",
        href: `/dashboard/formateur/parcours/${item.id}/edit`,
      }));
    };

    return {
      kpis: {
        totalLearners: enrollmentsResult.count ?? 0,
        activeCourses: coursesResult.count ?? 0,
        publishedTests: testsResult.count ?? 0,
        pendingReviews: pendingReviewsResult.count ?? 0,
      },
      activeCourses: mapCoursesToHighlights(activeCoursesQuery.data || []),
      recommendedCourses: mapCoursesToHighlights((activeCoursesQuery.data || [])?.slice(0, 3)),
      upcomingSessions: mapSessionsToHighlights(sessionsQuery.data),
      featuredTests: mapTestsToHighlights(testsQuery.data),
      resources: mapResourcesToHighlights(resourcesQuery.data),
      paths: mapPathsToHighlights(pathsQuery.data),
    };
  } catch (error) {
    console.warn("[formateur] Supabase query failed, returning empty data", error);
    return emptyDashboardData;
  }
};

const isCourseBuilderSnapshot = (snapshot: any): snapshot is CourseBuilderSnapshot => {
  return (
    snapshot &&
    typeof snapshot === "object" &&
    Array.isArray(snapshot.sections) &&
    Array.isArray(snapshot.resources) &&
    Array.isArray(snapshot.tests)
  );
};

export const getCourseBuilderSnapshot = async (courseId: string): Promise<CourseBuilderSnapshot | null> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable, returning null");
    return null;
  }

  try {
    const superAdmin = await isSuperAdmin();
    const adminClient = superAdmin ? await getServiceRoleClientOrFallback() : null;
    const client = adminClient ?? supabase;

    const { data, error } = await client
      .from("courses")
      .select("title, description, builder_snapshot")
      .eq("id", courseId)
      .maybeSingle();

    if (error) throw error;

    if (data?.builder_snapshot) {
      try {
        const parsed = typeof data.builder_snapshot === "string" ? JSON.parse(data.builder_snapshot) : data.builder_snapshot;
        if (isCourseBuilderSnapshot(parsed)) {
          return cloneCourseBuilderSnapshot(parsed);
        }
      } catch (parseError) {
        console.warn("[formateur] Unable to parse builder_snapshot", parseError);
      }
    }

    // Si pas de snapshot, retourner null (l'UI devra gérer le cas)
    return null;
  } catch (err) {
    console.warn("[formateur] Failed to fetch course snapshot, returning null", err);
    return null;
  }
};

export type FormateurCourseListItem = {
  id: string;
  title: string;
  status: "published" | "draft" | "scheduled";
  learners: number;
  completion: number;
  updatedAt: string;
  category: string;
  image: string;
  nextStep?: string;
};

export const getFormateurCourses = async (): Promise<FormateurCourseListItem[]> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable, returning empty courses");
    return [];
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const userId = authData?.user?.id ?? null;
    if (!userId) return [];

    // Récupérer les formations du formateur
    // Chercher dans creator_id OU owner_id
    const { data: coursesData, error: coursesError } = await supabase
      .from("courses")
      .select("id, title, status, cover_image, updated_at, created_at, builder_snapshot")
      .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (coursesError) throw coursesError;
    if (!coursesData || coursesData.length === 0) return [];

    // Compter les apprenants pour chaque formation
    const courseIds = coursesData.map((c) => c.id);
    const { data: enrollmentsData } = await supabase
      .from("enrollments")
      .select("course_id, user_id")
      .in("course_id", courseIds)
      .eq("role", "student");

    // Grouper les enrollments par course_id
    const learnersByCourse = new Map<string, number>();
    if (enrollmentsData) {
      enrollmentsData.forEach((e) => {
        const count = learnersByCourse.get(e.course_id) ?? 0;
        learnersByCourse.set(e.course_id, count + 1);
      });
    }

    // Mapper les données
    return coursesData.map((course) => {
      // Extraire la catégorie depuis builder_snapshot ou utiliser une valeur par défaut
      let category = "Formation";
      let completion = 0;
      if (course.builder_snapshot && typeof course.builder_snapshot === "object") {
        const snapshot = course.builder_snapshot as any;
        category = snapshot.general?.category || "Formation";
        // Calculer le pourcentage de complétion basé sur les sections/chapitres
        const sections = snapshot.sections || [];
        const totalChapters = sections.reduce((acc: number, s: any) => acc + (s.chapters?.length || 0), 0);
        completion = totalChapters > 0 ? Math.min(100, Math.round((totalChapters / Math.max(1, totalChapters)) * 100)) : 0;
      }

      const learners = learnersByCourse.get(course.id) ?? 0;
      const status = (course.status === "published" ? "published" : course.status === "scheduled" ? "scheduled" : "draft") as "published" | "draft" | "scheduled";

      return {
        id: String(course.id),
        title: course.title || "Formation sans titre",
        status,
        learners,
        completion,
        updatedAt: course.updated_at || course.created_at || new Date().toISOString(),
        category,
        image: course.cover_image || "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
        nextStep: status === "draft" ? "Finaliser la formation" : status === "published" ? undefined : "Publier la formation",
      };
    });
  } catch (error) {
    console.warn("[formateur] Error fetching courses", error);
    return [];
  }
};

export type FormateurTestListItem = {
  id: string;
  title: string;
  status: "published" | "draft" | "scheduled";
  type: string;
  attempts: number;
  averageScore: number;
  lastUpdated: string;
  tag?: string;
  description?: string;
};

export const getFormateurTests = async (): Promise<FormateurTestListItem[]> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable, returning empty tests");
    return [];
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const userId = authData?.user?.id ?? null;
    if (!userId) return [];

    // Récupérer les tests du formateur
    const { data: testsData, error: testsError } = await supabase
      .from("tests")
      .select("id, title, description, status, updated_at, created_at, owner_id, type")
      .or(`owner_id.eq.${userId},creator_id.eq.${userId}`)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (testsError) throw testsError;
    if (!testsData || testsData.length === 0) return [];

    // Récupérer les tentatives pour chaque test (si la table test_attempts existe)
    const testIds = testsData.map((t) => t.id);
    const { data: attemptsData } = await supabase
      .from("test_attempts")
      .select("test_id, score")
      .in("test_id", testIds);

    // Calculer les statistiques par test
    const attemptsByTest = new Map<string, { count: number; totalScore: number }>();
    if (attemptsData) {
      attemptsData.forEach((attempt: any) => {
        const existing = attemptsByTest.get(attempt.test_id) ?? { count: 0, totalScore: 0 };
        attemptsByTest.set(attempt.test_id, {
          count: existing.count + 1,
          totalScore: existing.totalScore + (attempt.score ?? 0),
        });
      });
    }

    return testsData.map((test) => {
      const stats = attemptsByTest.get(test.id) ?? { count: 0, totalScore: 0 };
      const averageScore = stats.count > 0 ? Math.round(stats.totalScore / stats.count) : 0;
      const status = (test.status === "published" ? "published" : test.status === "scheduled" ? "scheduled" : "draft") as "published" | "draft" | "scheduled";

      return {
        id: String(test.id),
        title: test.title || "Test sans titre",
        status,
        type: test.type || "Quiz",
        attempts: stats.count,
        averageScore,
        lastUpdated: test.updated_at || test.created_at || new Date().toISOString(),
        tag: undefined, // À extraire depuis un champ tag si disponible
        description: test.description || undefined,
      };
    });
  } catch (error) {
    console.warn("[formateur] Error fetching tests", error);
    return [];
  }
};

export type FormateurLearner = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export type FormateurGroup = {
  id: string;
  name: string;
  members_count: number;
};

export type CourseEnrollment = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

export const getFormateurLearners = async (): Promise<FormateurLearner[]> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable");
    return [];
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user?.id) {
      console.warn("[formateur] Auth error or no user", authError);
      return [];
    }

    const instructorUserId = authData.user.id;
    const superAdmin = await isSuperAdmin();

    if (superAdmin) {
      const adminClient = await getServiceRoleClientOrFallback();

      if (!adminClient) {
        console.warn("[formateur] Super admin sans client service role disponible");
        return [];
      }

      const { data, error } = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "learner")
        .order("full_name", { ascending: true, nullsLast: true })
        .limit(500);

      if (error || !data) {
        console.error("[formateur] Super admin - impossible de récupérer les apprenants:", error);
        return [];
      }

      const uniqueLearners = Array.from(
        new Map(
          data
            .filter((profile) => profile.id)
            .map((profile) => [
              profile.id,
              {
                id: profile.id,
                full_name: profile.full_name,
                email: profile.email,
              },
            ]),
        ).values(),
      );

      console.log("[formateur] Super admin - apprenants disponibles:", uniqueLearners.length);
      return uniqueLearners;
    }

    console.log("[formateur] Fetching learners for instructor:", instructorUserId);
    console.log("[formateur] Instructor email:", authData.user.email);

    // Utiliser la fonction PostgreSQL SECURITY DEFINER pour contourner RLS
    // Cette fonction est créée par le script CREATE_GET_INSTRUCTOR_LEARNERS_FUNCTION.sql
    console.log("[formateur] Calling RPC get_instructor_learners with:", { p_instructor_id: instructorUserId });
    
    const { data: learnersData, error: functionError } = await supabase.rpc(
      "get_instructor_learners",
      { p_instructor_id: instructorUserId }
    );
    
    console.log("[formateur] RPC raw response:", {
      hasData: !!learnersData,
      dataLength: learnersData?.length || 0,
      hasError: !!functionError,
      error: functionError,
      firstItem: learnersData?.[0] || null,
    });

    console.log("[formateur] RPC call result:", {
      hasError: !!functionError,
      error: functionError,
      hasData: !!learnersData,
      dataLength: learnersData?.length || 0,
      dataSample: learnersData?.slice(0, 2) || null
    });

    if (functionError) {
      console.error("[formateur] Error calling get_instructor_learners function:", functionError);
      console.error("[formateur] Function error details:", JSON.stringify(functionError, null, 2));
      
      // Fallback : essayer avec une requête directe si la fonction n'existe pas
      console.warn("[formateur] Function not available, falling back to direct query");
      
      // Essayer de récupérer les membreships directement (même si ça risque d'échouer)
      const instructorResult = await supabase
        .from("org_memberships")
        .select("org_id, role")
        .eq("user_id", instructorUserId)
        .eq("role", "instructor");
      
      if (instructorResult.error || !instructorResult.data || instructorResult.data.length === 0) {
        console.error("[formateur] Direct query also failed:", instructorResult.error);
        return [];
      }
      
      // Si on arrive ici, on a des membreships instructor
      const orgIds = instructorResult.data.map((m) => m.org_id).filter(Boolean);
      
      if (orgIds.length === 0) {
        return [];
      }
      
      // Essayer de récupérer les apprenants
      const learnerResult = await supabase
        .from("org_memberships")
        .select("user_id")
        .in("org_id", orgIds)
        .eq("role", "learner");
      
      if (learnerResult.error || !learnerResult.data || learnerResult.data.length === 0) {
        console.error("[formateur] Could not fetch learners:", learnerResult.error);
        return [];
      }
      
      const uniqueUserIds = [...new Set(learnerResult.data.map(m => m.user_id).filter(Boolean))];
      
      const profilesResult = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", uniqueUserIds);
      
      if (profilesResult.error || !profilesResult.data) {
        console.error("[formateur] Could not fetch profiles:", profilesResult.error);
        return [];
      }
      
      // Convertir en format attendu
      const learners = profilesResult.data.map((profile) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
      }));
      
      console.log("[formateur] Fallback query returned:", learners.length);
      return learners;
    }

    if (!learnersData || learnersData.length === 0) {
      console.warn("[formateur] No learners found for instructor:", instructorUserId);
      console.warn("[formateur] Checking instructor memberships...");
      
      // Vérifier si le formateur a des membreships
      const { data: memberships, error: membershipError } = await supabase
        .from("org_memberships")
        .select("org_id, role, user_id")
        .eq("user_id", instructorUserId)
        .eq("role", "instructor");
      
      console.warn("[formateur] Instructor memberships:", memberships?.length || 0, membershipError);
      
      if (memberships && memberships.length > 0) {
        const orgIds = memberships.map(m => m.org_id).filter(Boolean);
        console.warn("[formateur] Instructor org IDs:", orgIds);
        
        // Vérifier les apprenants dans ces orgs
        const { data: learnersInOrgs, error: learnersError } = await supabase
          .from("org_memberships")
          .select("user_id, org_id")
          .in("org_id", orgIds)
          .eq("role", "learner");
        
        console.warn("[formateur] Learners in instructor orgs:", learnersInOrgs?.length || 0, learnersError);
      }
      
      return [];
    }

    console.log("[formateur] Function returned learners:", learnersData.length);
    console.log("[formateur] Raw learners data (first 2):", JSON.stringify(learnersData.slice(0, 2), null, 2));

    // Convertir les données de la fonction en format attendu
    const learners = learnersData.map((row: any) => {
      console.log("[formateur] Processing learner row:", row);
      return {
        id: row.learner_id,
        full_name: row.learner_full_name,
        email: row.learner_email,
      };
    });

    console.log("[formateur] Converted learners:", learners.length);

    // Dédupliquer par ID (un apprenant peut être dans plusieurs organisations)
    const uniqueLearners = Array.from(
      new Map(learners.map((l) => [l.id, l])).values()
    );

    console.log("[formateur] Returning unique learners:", uniqueLearners.length);
    console.log("[formateur] Unique learners details:", JSON.stringify(uniqueLearners, null, 2));
    return uniqueLearners;
  } catch (error) {
    console.error("[formateur] Error fetching learners:", error);
    return [];
  }
};

export const getFormateurGroups = async (): Promise<FormateurGroup[]> => {
  const supabase = await getServerClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user?.id) return [];

    const superAdmin = await isSuperAdmin();

    if (superAdmin) {
      const adminClient = await getServiceRoleClientOrFallback();
      const { data: groups, error } = adminClient
        ? await adminClient
            .from("groups")
            .select("id, name, group_members(count)")
            .order("created_at", { ascending: false })
            .limit(200)
        : { data: null, error: null };

      if (error || !groups) return [];

      return groups.map((g) => ({
        id: g.id,
        name: g.name,
        members_count: Array.isArray(g.group_members) ? g.group_members.length : 0,
      }));
    }

    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", authData.user.id)
      .eq("role", "instructor")
      .single();

    if (!memberships?.org_id) return [];

    const { data: groups, error } = await supabase
      .from("groups")
      .select("id, name, group_members(count)")
      .eq("org_id", memberships.org_id);

    if (error || !groups) return [];

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      members_count: Array.isArray(g.group_members) ? g.group_members.length : 0,
    }));
  } catch (error) {
    console.warn("[formateur] Error fetching groups", error);
    return [];
  }
};

export const getCourseEnrollments = async (courseId: string): Promise<CourseEnrollment[]> => {
  const supabase = await getServerClient();

  if (!supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("enrollments")
      .select("user_id, profiles:profiles!inner(id, full_name, email)")
      .eq("course_id", courseId)
      .eq("role", "student");

    if (error || !data) return [];

    return data.map((e) => ({
      user_id: e.user_id,
      full_name: e.profiles?.full_name ?? null,
      email: e.profiles?.email ?? null,
    }));
  } catch (error) {
    console.warn("[formateur] Error fetching course enrollments", error);
    return [];
  }
};

export type FormateurPathOverview = {
  id: string;
  title: string;
  description: string;
  status: string;
  heroUrl: string;
  thumbnailUrl: string;
  updatedAt: string;
  courses: Array<{ id: string; title: string; coverImage: string; status: string; order: number }>;
  tests: Array<{ id: string; title: string; status: string; order: number }>;
  resources: Array<{ id: string; title: string; type: string; order: number }>;
};

const defaultCover = "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80";

export const getFormateurPaths = async (): Promise<FormateurPathOverview[]> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable, returning empty paths");
    return [];
  }

  try {
    const [{ data: authData, error: authError }, superAdmin] = await Promise.all([
      supabase.auth.getUser(),
      isSuperAdmin(),
    ]);
    if (authError) throw authError;

    const userId = authData?.user?.id ?? null;
    const adminClient = superAdmin ? await getServiceRoleClientOrFallback() : null;
    const client = adminClient ?? supabase;

    if (!client) {
      console.warn("[formateur] Aucun client Supabase disponible");
      return [];
    }

    // Récupérer d'abord les paths sans les jointures pour éviter les problèmes RLS
    // Utiliser creator_id ou owner_id selon ce qui existe dans la table
    // Note: Ne pas utiliser updated_at dans le SELECT pour éviter les erreurs si la colonne n'existe pas
    let query = client
      .from("paths")
      .select("id, title, description, status, thumbnail_url, hero_url, builder_snapshot, created_at, creator_id, owner_id")
      .order("created_at", { ascending: false })
      .limit(24);

    // Filtrer par creator_id ou owner_id selon ce qui existe
    if (userId) {
      // Essayer d'abord owner_id, puis creator_id
      query = query.or(`owner_id.eq.${userId},creator_id.eq.${userId}`);
    }

    const { data: pathsData, error: pathsError } = await query;
    
    if (pathsError) {
      console.error("[formateur] Error fetching paths:", pathsError);
      throw pathsError;
    }

    if (!pathsData || pathsData.length === 0) {
      return [];
    }

    // Récupérer séparément les contenus associés aux paths pour éviter les problèmes RLS avec les jointures
    const pathIds = pathsData.map((p) => p.id);
    
    const [pathCoursesData, pathTestsData, pathResourcesData] = await Promise.all([
      client
        .from("path_courses")
        .select("path_id, course_id, order, courses(id, title, cover_image, status)")
        .in("path_id", pathIds),
      client
        .from("path_tests")
        .select("path_id, test_id, order, tests(id, title, description, status)")
        .in("path_id", pathIds),
      client
        .from("path_resources")
        .select("path_id, resource_id, order, resources(id, title, kind, cover_url, published)")
        .in("path_id", pathIds),
    ]);

    // Grouper les contenus par path_id
    const coursesByPath = new Map<string, any[]>();
    const testsByPath = new Map<string, any[]>();
    const resourcesByPath = new Map<string, any[]>();

    if (pathCoursesData.data) {
      pathCoursesData.data.forEach((item: any) => {
        if (!coursesByPath.has(item.path_id)) {
          coursesByPath.set(item.path_id, []);
        }
        coursesByPath.get(item.path_id)!.push(item);
      });
    }

    if (pathTestsData.data) {
      pathTestsData.data.forEach((item: any) => {
        if (!testsByPath.has(item.path_id)) {
          testsByPath.set(item.path_id, []);
        }
        testsByPath.get(item.path_id)!.push(item);
      });
    }

    if (pathResourcesData.data) {
      pathResourcesData.data.forEach((item: any) => {
        if (!resourcesByPath.has(item.path_id)) {
          resourcesByPath.set(item.path_id, []);
        }
        resourcesByPath.get(item.path_id)!.push(item);
      });
    }

    const mapRow = (row: any): FormateurPathOverview => {
      // Utiliser les données groupées au lieu des jointures
      const mapCourses = coursesByPath.get(row.id) ?? [];
      const mapTests = testsByPath.get(row.id) ?? [];
      const mapResources = resourcesByPath.get(row.id) ?? [];

      return {
        id: String(row.id ?? randomUUID()),
        title: row.title ?? "Parcours",
        description: row.description ?? "Assemblez vos formations, tests et ressources pour concevoir un parcours signature.",
        status: row.status ?? "draft",
        heroUrl: row.hero_url ?? defaultCover,
        thumbnailUrl: row.thumbnail_url ?? defaultCover,
              updatedAt: row.updated_at ?? row.created_at ?? new Date().toISOString(),
        courses: mapCourses
          .map((item: any) => ({
            id: String(item.courses?.id ?? randomUUID()),
            title: item.courses?.title ?? "Formation",
            coverImage: item.courses?.cover_image ?? defaultCover,
            status: item.courses?.status ?? "draft",
            order: item.order ?? 0,
          }))
          .sort((a: any, b: any) => a.order - b.order),
        tests: mapTests
          .map((item: any) => ({
            id: String(item.tests?.id ?? randomUUID()),
            title: item.tests?.title ?? "Test",
            status: item.tests?.status ?? "draft",
            order: item.order ?? 0,
          }))
          .sort((a: any, b: any) => a.order - b.order),
        resources: mapResources
          .map((item: any) => ({
            id: String(item.resources?.id ?? randomUUID()),
            title: item.resources?.title ?? "Ressource",
            type: item.resources?.kind ?? "guide", // kind dans la DB
            order: item.order ?? 0,
          }))
          .sort((a: any, b: any) => a.order - b.order),
      };
    };

    return pathsData.map(mapRow);
  } catch (error) {
    console.warn("[formateur] Supabase query failed, returning empty paths", error);
    return [];
  }
};

export type FormateurContentLibrary = {
  courses: Array<{
    id: string;
    title: string;
    category: string;
    duration: string;
    coverImage: string | null;
    status: string;
  }>;
  tests: Array<{
    id: string;
    title: string;
    description: string | null;
    duration: string;
    status: string;
  }>;
  resources: Array<{
    id: string;
    title: string;
    type: string;
    thumbnail: string | null;
    status: string;
  }>;
};

export type AssignableContent = {
  courses: Array<{ id: string; title: string; status: string }>;
  paths: Array<{ id: string; title: string; status: string }>;
  resources: Array<{ id: string; title: string; published: boolean }>;
  tests: Array<{ id: string; title: string; status: string }>;
};

export const getFormateurAssignableContent = async (): Promise<AssignableContent> => {
  const supabase = await getServerClient();

  if (!supabase) {
    return {
      courses: [],
      paths: [],
      resources: [],
      tests: [],
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const userId = authData?.user?.id ?? null;
    if (!userId) {
      return {
        courses: [],
        paths: [],
        resources: [],
        tests: [],
      };
    }

    // 1. Récupérer les organisations où l'utilisateur est instructor
    const { data: instructorMemberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", userId)
      .eq("role", "instructor");

    const orgIds = instructorMemberships?.map((m) => m.org_id) ?? [];

    // 2. Récupérer tous les contenus : ceux créés par l'utilisateur OU ceux de ses organisations
    // Récupérer d'abord les parcours séparément car il faut combiner plusieurs critères
    // Récupérer les parcours par owner_id ou creator_id
    const { data: pathsByOwner } = await supabase
      .from("paths")
      .select("id")
      .or(`owner_id.eq.${userId},creator_id.eq.${userId}`);
    
    // Récupérer les parcours par org_id si l'utilisateur a des organisations
    let pathsByOrg: string[] = [];
    if (orgIds.length > 0) {
      const { data: pathsInOrg } = await supabase
        .from("paths")
        .select("id")
        .in("org_id", orgIds);
      pathsByOrg = pathsInOrg?.map((p) => p.id) ?? [];
    }
    
    // Combiner tous les IDs de parcours
    const allPathIds = [
      ...(pathsByOwner?.map((p) => p.id) ?? []),
      ...pathsByOrg,
    ];
    
    const uniquePathIds = [...new Set(allPathIds)];
    
    // Maintenant récupérer tous les contenus en parallèle
    const [coursesResult, formationsResult, pathsResult, testsResult, resourcesResult] = await Promise.all([
      // Cours créés par l'utilisateur
      (async () => {
        const query = supabase
            .from("courses")
          .select("id, title, status")
          .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
          .order("title", { ascending: true })
          .limit(200);
        
        const result = await query;
        
        if (result.error) {
          console.error("[formateur] Error fetching courses for assignment:", {
            error: result.error,
            code: result.error.code,
            message: result.error.message,
            details: result.error.details,
            hint: result.error.hint,
            userId,
          });
        } else {
          console.log("[formateur] Fetched courses for assignment:", {
            count: result.data?.length ?? 0,
            courses: result.data?.map(c => ({ id: c.id, title: c.title, status: c.status })),
          });
        }
        
        return result;
      })(),
      // Formations créées par l'utilisateur dans ses organisations
      // On ne récupère PAS les formations pour l'instant car :
      // 1. La table formations n'a pas de colonne author_id/creator_id/owner_id
      // 2. On ne peut pas distinguer les formations du formateur de celles d'autres formateurs dans la même org
      // Solution temporaire : ne pas récupérer les formations de la table formations
      // Utiliser uniquement la table courses pour l'assignation
      Promise.resolve({ data: [], error: null }),
      // Parcours : récupérer les détails maintenant que nous avons les IDs
      uniquePathIds.length > 0
        ? supabase
            .from("paths")
            .select("id, title, status")
            .in("id", uniquePathIds)
            .order("title", { ascending: true })
            .limit(200)
        : Promise.resolve({ data: [], error: null }),
            // Tests créés par l'utilisateur
            supabase
              .from("tests")
              .select("id, title, status")
              .eq("created_by", userId)
              .order("title", { ascending: true })
              .limit(200),
            // Ressources créées par l'utilisateur
            supabase
            .from("resources")
              .select("id, title, published")
              .eq("created_by", userId)
              .order("title", { ascending: true })
              .limit(200),
    ]);

    // Pour l'instant, on utilise UNIQUEMENT la table courses
    // La table formations n'a pas de colonne pour identifier le créateur
    // Donc on ne peut pas filtrer les formations par formateur
    // Solution : ne pas afficher les formations de la table formations dans le modal d'assignation
    
    // Log si pas de cours trouvés
    if (!coursesResult.data || coursesResult.data.length === 0) {
      console.warn("[formateur] No courses found for assignment", {
        userId,
        error: coursesResult.error,
        hasError: !!coursesResult.error,
      });
      
      // Vérifier si le problème vient de RLS en testant une requête simple
      const { data: testCourse } = await supabase
        .from("courses")
        .select("id, title")
        .eq("creator_id", userId)
        .limit(1);
      
      console.log("[formateur] Test query with creator_id only:", {
        found: !!testCourse,
        count: testCourse?.length ?? 0,
      });
    }
    
    const allCourses = (coursesResult.data ?? []).map((c) => ({
      id: String(c.id),
      title: c.title || "Formation sans titre",
      status: c.status || "draft",
    }));

    return {
      courses: allCourses,
      paths: (pathsResult.data ?? []).map((p) => ({
        id: String(p.id),
        title: p.title || "Parcours sans titre",
        status: p.status || "draft",
      })),
      resources: (resourcesResult.data ?? []).map((r) => ({
        id: String(r.id),
        title: r.title || "Ressource sans titre",
        published: r.published ?? false,
      })),
      tests: (testsResult.data ?? []).map((t) => ({
        id: String(t.id),
        title: t.title || "Test sans titre",
        status: t.status || "draft",
      })),
    };
  } catch (error) {
    console.warn("[formateur] Error fetching assignable content", error);
    return {
      courses: [],
      paths: [],
      resources: [],
      tests: [],
    };
  }
};

export const getFormateurContentLibrary = async (): Promise<FormateurContentLibrary> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable, returning empty library");
    return {
      courses: [],
      tests: [],
      resources: [],
    };
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const userId = authData?.user?.id ?? null;
    if (!userId) {
      return {
        courses: [],
        tests: [],
        resources: [],
      };
    }

    const superAdmin = await isSuperAdmin();
    const client = (superAdmin ? await getServiceRoleClientOrFallback() : null) ?? supabase;

    if (!client) {
      console.warn("[formateur] Impossible d'obtenir un client Supabase pour le contenu formateur");
      return {
        courses: [],
        tests: [],
        resources: [],
      };
    }

    const db = client;

    // Récupérer les cours, tests et ressources du formateur
    // Note: category et duration peuvent ne pas exister, on les retire de la query
    const [coursesResult, testsResult, resourcesResult] = await Promise.all([
      db
        .from("courses")
        .select("id, title, cover_image, status, builder_snapshot")
        .or(`creator_id.eq.${userId},owner_id.eq.${userId}`)
        .order("updated_at", { ascending: false })
        .limit(100),
      // Tests : Récupérer d'abord les IDs qui correspondent, puis faire une query séparée
      // pour éviter les problèmes avec .or() et RLS
      (async () => {
        // Essayer d'abord avec created_by
        const { data: testsByCreatedBy } = await db
          .from("tests")
      .select("id")
      .eq("created_by", userId);

        // Puis avec owner_id
        const { data: testsByOwner } = await db
          .from("tests")
        .select("id")
          .eq("owner_id", userId);
        
        const testIds = [
          ...(testsByCreatedBy?.map((t) => t.id) ?? []),
          ...(testsByOwner?.map((t) => t.id) ?? []),
        ];
        
        if (testIds.length === 0) {
          return { data: [], error: null };
        }
        
        // Récupérer les tests avec ces IDs
        return await db
          .from("tests")
          .select("id, title, description, status")
          .in("id", testIds)
          .order("updated_at", { ascending: false })
          .limit(100);
      })(),
      // Resources : Récupérer par created_by, owner_id, creator_id, ou org_id
      (async () => {
        // Récupérer les organisations où l'utilisateur est instructor/admin/tutor
        const { data: memberships } = await db
          .from("org_memberships")
          .select("org_id")
          .eq("user_id", userId)
          .in("role", ["instructor", "admin", "tutor"]);
        
        const orgIds = memberships?.map((m) => m.org_id) ?? [];
        console.log("[formateur] Resources - Org IDs trouvés:", orgIds);
        
        // Récupérer les IDs de ressources selon plusieurs critères
        const [resourcesByCreatedBy, resourcesByOwner, resourcesByCreator, resourcesByOrg] = await Promise.all([
        db
            .from("resources")
            .select("id")
            .eq("created_by", userId),
          db
            .from("resources")
            .select("id")
            .eq("owner_id", userId),
          // Note: creator_id n'existe pas dans resources, on ne cherche que created_by et owner_id
          Promise.resolve({ data: [], error: null }),
          orgIds.length > 0
            ? db
                .from("resources")
                .select("id, org_id")
                .in("org_id", orgIds)
            : Promise.resolve({ data: [], error: null }),
        ]);
        
        console.log("[formateur] Resources - Résultats des requêtes:", {
          byCreatedBy: resourcesByCreatedBy?.data?.length ?? 0,
          byOwner: resourcesByOwner?.data?.length ?? 0,
          byCreator: resourcesByCreator?.data?.length ?? 0,
          byOrg: resourcesByOrg?.data?.length ?? 0,
          errors: {
            byCreatedBy: resourcesByCreatedBy?.error?.message,
            byOwner: resourcesByOwner?.error?.message,
            byCreator: resourcesByCreator?.error?.message,
            byOrg: resourcesByOrg?.error?.message,
          },
        });
        
        // Combiner tous les IDs uniques
        const resourceIds = [
          ...(resourcesByCreatedBy?.data?.map((r) => r.id) ?? []),
          ...(resourcesByOwner?.data?.map((r) => r.id) ?? []),
          ...(resourcesByCreator?.data?.map((r) => r.id) ?? []),
          ...(resourcesByOrg?.data?.map((r) => r.id) ?? []),
        ];
        
        // Dédupliquer les IDs
        const uniqueResourceIds = [...new Set(resourceIds)];
        console.log("[formateur] Resources - IDs uniques trouvés:", uniqueResourceIds.length, uniqueResourceIds);
        
        if (uniqueResourceIds.length === 0) {
          return { data: [], error: null };
        }
        
        // Sélectionner uniquement les colonnes qui existent vraiment
        // On essaie d'abord avec les colonnes de base
        let finalResult = await db
          .from("resources")
          .select("id, title, created_by, org_id, created_at")
          .in("id", uniqueResourceIds);
        
        // Si ça fonctionne, essayer d'ajouter d'autres colonnes optionnelles
        if (!finalResult.error && finalResult.data) {
          // Essayer de récupérer plus de colonnes si elles existent
          const extendedResult = await db
            .from("resources")
            .select("id, title, description, cover_url, thumbnail_url, created_by, owner_id, org_id, published, kind, type, resource_type, updated_at, created_at")
            .in("id", uniqueResourceIds);
          
          // Si pas d'erreur, utiliser le résultat étendu, sinon garder le basique
          if (!extendedResult.error && extendedResult.data) {
            finalResult = extendedResult;
          }
        }
        
        // Trier par updated_at ou created_at
        if (finalResult.data && finalResult.data.length > 0) {
          // Si updated_at existe, trier par updated_at, sinon par created_at
          finalResult.data.sort((a: any, b: any) => {
            const aDate = a.updated_at ? new Date(a.updated_at).getTime() : (a.created_at ? new Date(a.created_at).getTime() : 0);
            const bDate = b.updated_at ? new Date(b.updated_at).getTime() : (b.created_at ? new Date(b.created_at).getTime() : 0);
            return bDate - aDate; // Descendant
          });
          
          // Limiter à 100
          finalResult.data = finalResult.data.slice(0, 100);
        }
        
        console.log("[formateur] Resources - Résultat final:", {
          count: finalResult.data?.length ?? 0,
          error: finalResult.error?.message,
          resources: finalResult.data?.map((r: any) => ({
            id: r.id,
            title: r.title,
            created_by: r.created_by,
            owner_id: r.owner_id,
            creator_id: r.creator_id,
            org_id: r.org_id,
          })),
        });
        
        return finalResult;
      })(),
    ]);

    // Log des erreurs et données pour déboguer
    console.log("[formateur] Courses query result:", {
      hasError: !!coursesResult.error,
      error: coursesResult.error ? {
        message: coursesResult.error.message,
        code: coursesResult.error.code,
        details: coursesResult.error.details,
        hint: coursesResult.error.hint,
      } : null,
      dataCount: coursesResult.data?.length ?? 0,
    });
    
    if (coursesResult.error) {
      console.error("[formateur] Error fetching courses for library:", coursesResult.error);
    }
    console.log("[formateur] Tests query result:", {
      hasError: !!testsResult.error,
      error: testsResult.error ? {
        message: testsResult.error.message,
        code: testsResult.error.code,
        details: testsResult.error.details,
      } : null,
      dataCount: testsResult.data?.length ?? 0,
    });
    
    console.log("[formateur] Resources query result:", {
      hasError: !!resourcesResult.error,
      error: resourcesResult.error ? {
        message: resourcesResult.error.message,
        code: resourcesResult.error.code,
        details: resourcesResult.error.details,
      } : null,
      dataCount: resourcesResult.data?.length ?? 0,
    });
    
    if (testsResult.error) {
      console.error("[formateur] Error fetching tests for library:", testsResult.error);
    }
    if (resourcesResult.error) {
      console.error("[formateur] Error fetching resources for library:", resourcesResult.error);
    }

    const dedupeById = <T extends { id: unknown }>(items: T[]): T[] => {
      return Array.from(new Map(items.map((item) => [String(item.id), item])).values());
    };

    const courseRows = dedupeById(coursesResult.data ?? []);
    const testRows = dedupeById(testsResult.data ?? []);
    const resourceRows = dedupeById(resourcesResult.data ?? []);

    // Extraire category et duration depuis builder_snapshot pour les cours
    const courses = courseRows.map((course: any) => {
      let category = "";
      let duration = "";
      
      if (course.builder_snapshot?.general) {
        category = course.builder_snapshot.general.category || "";
        duration = course.builder_snapshot.general.duration || "";
      }

      return {
        id: String(course.id),
        title: course.title || "Formation sans titre",
        category: category || "Non catégorisé", // category vient du builder_snapshot uniquement
        duration: duration || "", // duration vient du builder_snapshot uniquement
        coverImage: course.cover_image || null,
        status: course.status || "draft",
      };
    });

    const tests = testRows.map((test: any) => ({
      id: String(test.id),
      title: test.title || "Test sans titre",
      description: test.description || null,
      duration: "", // La durée n'est pas stockée dans la table tests
      status: test.status || "draft",
    }));

    const resources = resourceRows.map((resource: any) => {
      // Gérer published (boolean) - status n'existe pas dans votre table
      let status: "published" | "draft" = "draft";
      if (resource.published !== undefined && resource.published !== null) {
        status = resource.published ? "published" : "draft";
      }
      
      // Déterminer le type : kind, type, ou resource_type (selon ce qui existe)
      const resourceType = resource.kind || resource.type || resource.resource_type || "guide";
      
      // Déterminer la thumbnail : cover_url ou thumbnail_url
      const thumbnail = resource.cover_url || resource.thumbnail_url || null;
      
      return {
        id: String(resource.id),
        title: resource.title || "Ressource sans titre",
        type: resourceType,
        thumbnail,
        status,
        published: resource.published ?? false, // Utiliser published directement
      };
    });
    
    console.log("[formateur] Resources mapped:", {
      count: resources.length,
      resources: resources.map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type,
        status: r.status,
      })),
    });

    return {
      courses,
      tests,
      resources,
    };
  } catch (error) {
    console.warn("[formateur] Error fetching content library", error);
    return {
      courses: [],
      tests: [],
      resources: [],
    };
  }
};

// ============================================
// Types et fonctions pour le Drive formateur
// ============================================

export type FormateurDriveDocument = {
  id: string;
  title: string;
  author: string;
  authorRole: string;
  authorEmail: string;
  depositedAt: string;
  dueAt: string | null;
  aiUsageScore: number;
  wordCount: number;
  summary: string | null;
  fileUrl: string | null;
  isRead: boolean;
  isLate: boolean;
  folderId: string | null;
  folderName: string | null;
};

export const getFormateurDriveDocuments = async (): Promise<FormateurDriveDocument[]> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable, returning empty documents");
    return [];
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const userId = authData?.user?.id ?? null;
    if (!userId) {
      return [];
    }

    // Utiliser le service role client pour contourner RLS
    const adminClient = await getServiceRoleClientOrFallback();
    const queryClient = adminClient ?? supabase;

    // Récupérer les documents partagés avec le formateur
    // Un document est partagé si shared_with = userId OU si l'auteur est un apprenant du formateur
    // On récupère d'abord les apprenants assignés au formateur
    const learners = await getFormateurLearners();
    const learnerIds = learners.map((l) => l.id);
    
    console.log("[formateur] Fetching drive documents for instructor:", userId);
    console.log("[formateur] Found", learnerIds.length, "learners:", learnerIds);
    
    // On récupère d'abord les documents sans jointures pour éviter les problèmes RLS
    // Note: La structure de drive_documents peut varier selon la migration utilisée
    // Version 005: name, user_id, folder_id, url (pas de content, title, summary)
    // Version 003: title, content, summary, author_id, folder_id, status, shared_with
    
    // Essayer d'abord avec les colonnes minimales pour éviter les erreurs
    // La table drive_documents peut avoir soit 'user_id' (version 005) soit 'author_id' (version 003)
    let documentsData: any[] | null = null;
    let documentsError: any = null;
    
    // Tentative 1: Version avec author_id (version 003) - récupérer les documents partagés OU créés par les apprenants
    // D'abord, essayer de vérifier si status existe en faisant une requête simple
    let queryWithAuthorId;
    if (learnerIds.length > 0) {
      // Faire deux requêtes séparées au lieu de OR pour éviter les problèmes RLS
      console.log("[formateur] Making separate queries - shared_with and author_id");
      console.log("[formateur] Instructor ID:", userId);
      console.log("[formateur] Learner IDs:", learnerIds);
      
      // Requête 1: Documents explicitement partagés avec le formateur
      const querySharedWith = await queryClient
        .from("drive_documents")
        .select("id, title, author_id, folder_id, file_url, status, shared_with, content, summary, word_count, ai_usage_score, deposited_at, submitted_at, is_read, updated_at")
        .eq("shared_with", userId)
        .eq("status", "shared")
        .limit(100);
      
      console.log("[formateur] Query shared_with result:", {
        hasData: !!querySharedWith.data,
        dataLength: querySharedWith.data?.length || 0,
        error: querySharedWith.error,
      });
      
      // Requête 2: Documents des apprenants assignés avec status = 'shared'
      const queryLearners = await queryClient
        .from("drive_documents")
        .select("id, title, author_id, folder_id, file_url, status, shared_with, content, summary, word_count, ai_usage_score, deposited_at, submitted_at, is_read, updated_at")
        .in("author_id", learnerIds)
        .eq("status", "shared")
        .limit(100);
      
      console.log("[formateur] Query learners result:", {
        hasData: !!queryLearners.data,
        dataLength: queryLearners.data?.length || 0,
        error: queryLearners.error,
      });
      
      // Combiner les résultats et dédupliquer par ID
      const sharedDocs = querySharedWith.data || [];
      const learnerDocs = queryLearners.data || [];
      const allDocs = [...sharedDocs, ...learnerDocs];
      const uniqueDocs = Array.from(
        new Map(allDocs.map((doc: any) => [doc.id, doc])).values()
      );
      
      console.log("[formateur] Combined result:", {
        sharedDocsCount: sharedDocs.length,
        learnerDocsCount: learnerDocs.length,
        uniqueDocsCount: uniqueDocs.length,
      });
      
      if (querySharedWith.error && queryLearners.error) {
        queryWithAuthorId = { data: null, error: querySharedWith.error };
      } else {
        queryWithAuthorId = { data: uniqueDocs, error: null };
      }
    } else {
      // Seulement les documents explicitement partagés avec le formateur
      console.log("[formateur] No learners found, querying only shared_with documents");
      queryWithAuthorId = await queryClient
        .from("drive_documents")
        .select("id, title, author_id, folder_id, file_url, status, shared_with, content, summary, word_count, ai_usage_score, deposited_at, submitted_at, is_read, updated_at")
        .eq("shared_with", userId)
        .eq("status", "shared")
        .limit(100);
      
      // Si ça échoue à cause de la colonne status, essayer sans status
      if (queryWithAuthorId.error?.code === '42703' && queryWithAuthorId.error?.message?.includes('status')) {
        console.warn("[formateur] Column 'status' does not exist, trying without status filter");
        queryWithAuthorId = await queryClient
          .from("drive_documents")
          .select("id, title, author_id, folder_id, file_url, shared_with, content, summary, word_count, ai_usage_score, deposited_at, submitted_at, is_read, updated_at")
          .eq("shared_with", userId)
          .limit(100);
      }
    }
    
    if (queryWithAuthorId.error) {
      console.warn("[formateur] Query with author_id failed:", queryWithAuthorId.error);
      console.warn("[formateur] Error code:", queryWithAuthorId.error?.code);
      console.warn("[formateur] Error message:", queryWithAuthorId.error?.message);
    }
    
    if (!queryWithAuthorId.error && queryWithAuthorId.data) {
      documentsData = queryWithAuthorId.data;
      console.log("[formateur] Query with author_id succeeded, found", documentsData.length, "documents");
    } else {
      // Tentative 2: Version avec user_id (version 005) - récupérer les documents partagés
      console.warn("[formateur] Query with author_id failed, trying with user_id");
      let queryWithUserId;
      if (learnerIds.length > 0) {
        // Version 005: user_id, name, url (pas de status, shared_with, title, author_id)
        queryWithUserId = await queryClient
          .from("drive_documents")
          .select("id, user_id, folder_id, url, name, created_at, updated_at")
          .in("user_id", learnerIds)
          .limit(100);
      } else {
        // Version 005 n'a pas shared_with, on ne peut que filtrer par user_id
        queryWithUserId = await queryClient
          .from("drive_documents")
          .select("id, user_id, folder_id, url, name, created_at, updated_at")
          .limit(0); // Aucun résultat car pas de shared_with dans version 005
      }
      
      if (queryWithUserId.error) {
        console.warn("[formateur] Query with user_id failed:", queryWithUserId.error);
        console.warn("[formateur] Error code:", queryWithUserId.error?.code);
        console.warn("[formateur] Error message:", queryWithUserId.error?.message);
      }
      
      if (!queryWithUserId.error && queryWithUserId.data) {
        documentsData = queryWithUserId.data;
        console.log("[formateur] Query with user_id succeeded");
      } else {
        // Tentative 3: Requête ultra-simple (juste l'ID pour voir si la table existe)
        console.warn("[formateur] Both queries failed, trying ultra-simple query");
        const simpleQuery = await queryClient
          .from("drive_documents")
          .select("id")
          .limit(10);
        
        if (simpleQuery.error) {
          console.error("[formateur] Even simple query failed - table might not exist or RLS blocking:", simpleQuery.error);
          documentsError = simpleQuery.error;
        } else if (simpleQuery.data && simpleQuery.data.length > 0) {
          // La table existe et on peut lire des données, mais on ne peut pas filtrer
          // Utiliser les données sans filtre pour l'instant
          console.warn("[formateur] Simple query works, using unfiltered data");
          documentsData = simpleQuery.data;
          // On ne peut pas récupérer les autres colonnes pour l'instant, retourner un format minimal
          documentsData = documentsData.map((doc: any) => ({
            id: doc.id,
            title: "Document",
            author_id: null,
            folder_id: null,
            file_url: null,
          }));
        } else {
          // Pas de données, retourner vide
          console.warn("[formateur] No documents found");
          documentsData = [];
        }
      }
    }

    if (documentsError) {
      // Si c'est juste une erreur de colonne manquante ou table vide, retourner vide silencieusement
      if (documentsError?.code === '42703') {
        console.warn("[formateur] Column error - table structure may differ, returning empty array");
        return [];
      }
      // Pour les autres erreurs (RLS, etc.), logger mais retourner vide
      console.warn("[formateur] Error fetching drive documents:", documentsError?.message || documentsError);
      return [];
    }

    if (!documentsData || documentsData.length === 0) {
    return [];
  }

    // Récupérer les auteurs (author_id ou user_id selon la version) et dossiers séparément
    const authorIds = [
      ...new Set(
        documentsData.map((d: any) => d.author_id || d.user_id).filter(Boolean)
      ),
    ];
    const folderIds = [...new Set(documentsData.map((d: any) => d.folder_id).filter(Boolean))];

    const [authorsData, foldersData] = await Promise.all([
      authorIds.length > 0
        ? supabase
            .from("profiles")
            .select("id, email, full_name")
            .in("id", authorIds)
        : Promise.resolve({ data: [], error: null }),
      folderIds.length > 0
        ? supabase
            .from("drive_folders")
            .select("id, name")
            .in("id", folderIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const authors = new Map((authorsData.data ?? []).map((a: any) => [a.id, a]));
    const folders = new Map((foldersData.data ?? []).map((f: any) => [f.id, f]));

    // Mapper les documents au format attendu (gérer les deux versions de la table)
    const documents: FormateurDriveDocument[] = documentsData.map((doc: any) => {
      const authorId = doc.author_id || doc.user_id;
      const author = authorId ? authors.get(authorId) : null;
      const folder = doc.folder_id ? folders.get(doc.folder_id) : null;
      
      // Détecter quelle version de la table on utilise
      const isVersion003 = !!doc.author_id; // Version avec title, author_id, content
      const isVersion005 = !!doc.user_id && !!doc.name; // Version avec name, user_id, url

      // Formater les dates
      const formatDate = (date: Date | string | null): string => {
        if (!date) return "";
        const d = typeof date === "string" ? new Date(date) : date;
        return d.toLocaleString("fr-FR", {
          dateStyle: "long",
          timeStyle: "short",
        });
      };

      // Mapper selon la version de la table
      if (isVersion003) {
        // Version 003: title, author_id, content, summary, deposited_at, file_url
        const isLate = doc.due_at
          ? new Date(doc.due_at) < new Date() && (!doc.submitted_at || new Date(doc.submitted_at) > new Date(doc.due_at))
          : false;
        
        return {
          id: String(doc.id),
          title: doc.title || "Document sans titre",
          author: author?.full_name || author?.email || "Auteur inconnu",
          authorRole: author?.email ? "Apprenant" : "Auteur",
          authorEmail: author?.email || "",
          depositedAt: formatDate(doc.deposited_at || doc.submitted_at || doc.updated_at),
          dueAt: doc.due_at ? formatDate(doc.due_at) : null,
          aiUsageScore: Number(doc.ai_usage_score || 0),
          wordCount: Number(doc.word_count || 0),
          summary: doc.summary || null,
          fileUrl: (doc.file_url && doc.file_url.trim()) ? doc.file_url : null,
          isRead: doc.is_read || false,
          isLate,
          folderId: doc.folder_id ? String(doc.folder_id) : null,
          folderName: folder?.name || null,
        };
      } else {
        // Structure alternative (si certaines colonnes n'existent pas)
        return {
          id: String(doc.id),
          title: doc.title || doc.name || "Document sans titre",
          author: author?.full_name || author?.email || "Auteur inconnu",
          authorRole: author?.email ? "Apprenant" : "Auteur",
          authorEmail: author?.email || "",
          depositedAt: formatDate(doc.deposited_at || doc.updated_at || doc.submitted_at),
          dueAt: doc.due_at ? formatDate(doc.due_at) : null,
          aiUsageScore: Number(doc.ai_usage_score || 0),
          wordCount: Number(doc.word_count || 0),
          summary: doc.summary || null,
          fileUrl: (doc.file_url && doc.file_url.trim()) ? doc.file_url : null,
          isRead: doc.is_read || false,
          isLate: false,
          folderId: doc.folder_id ? String(doc.folder_id) : null,
          folderName: folder?.name || null,
        };
      }
    });

    return documents;
  } catch (error) {
    console.warn("[formateur] Error fetching drive documents", error);
    return [];
  }
};

export const getFormateurDriveDocumentById = async (
  documentId: string,
): Promise<FormateurDriveDocument | null> => {
  const supabase = await getServerClient();

  if (!supabase) {
    console.warn("[formateur] Supabase client unavailable");
    return null;
  }

  try {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const userId = authData?.user?.id ?? null;
    if (!userId) {
      return null;
    }

    // Utiliser le service role client pour contourner RLS
    const adminClient = await getServiceRoleClientOrFallback();
    const queryClient = adminClient ?? supabase;

    // Récupérer le document sans jointures pour éviter les problèmes RLS
    // Essayer d'abord avec les colonnes de base (sans due_at qui peut ne pas exister)
    let { data: documentData, error: documentError } = await queryClient
      .from("drive_documents")
      .select(`
        id,
        title,
        content,
        summary,
        author_id,
        folder_id,
        status,
        shared_with,
        ai_usage_score,
        word_count,
        file_url,
        deposited_at,
        submitted_at,
        is_read,
        updated_at
      `)
      .eq("id", documentId)
      .single();

    // Si erreur, essayer avec moins de colonnes (peut-être que certaines n'existent pas)
    if (documentError) {
      console.warn("[formateur] First query failed, trying with minimal columns:", documentError);
      // Essayer avec updated_at au lieu de created_at
      const minimalQuery = await queryClient
        .from("drive_documents")
        .select("id, title, author_id, folder_id, status, shared_with, file_url, updated_at")
        .eq("id", documentId)
        .single();
      
      if (minimalQuery.error) {
        // Dernière tentative : seulement les colonnes essentielles
        const essentialQuery = await queryClient
          .from("drive_documents")
          .select("id, title, author_id, folder_id, status, shared_with, file_url")
          .eq("id", documentId)
          .single();
        
        if (essentialQuery.error) {
          console.error("[formateur] Error fetching drive document:", {
            error: essentialQuery.error,
            code: essentialQuery.error.code,
            message: essentialQuery.error.message,
            details: essentialQuery.error.details,
            hint: essentialQuery.error.hint,
            documentId,
          });
          return null;
        }
        
        documentData = essentialQuery.data;
        // Ajouter updated_at manuellement si nécessaire
        if (!documentData.updated_at) {
          documentData.updated_at = new Date().toISOString();
        }
        documentError = null;
      } else {
        documentData = minimalQuery.data;
        documentError = null;
      }
    }

    if (!documentData) {
      console.warn("[formateur] Document not found:", documentId);
      return null;
    }

    // Vérifier que le document est accessible au formateur
    // Le document est accessible si :
    // 1. Il est explicitement partagé avec le formateur (shared_with = userId)
    // 2. OU l'auteur est un apprenant du formateur
    const learners = await getFormateurLearners();
    const learnerIds = learners.map((l) => l.id);
    const authorId = documentData.author_id;
    
    const isSharedWithInstructor = documentData.shared_with === userId && documentData.status === "shared";
    const isFromLearner = authorId && learnerIds.includes(authorId) && documentData.status === "shared";
    
    if (!isSharedWithInstructor && !isFromLearner) {
      console.warn("[formateur] Document not accessible to instructor:", {
        documentId,
        shared_with: documentData.shared_with,
        userId,
        authorId,
        isLearner: learnerIds.includes(authorId || ""),
        status: documentData.status,
      });
      return null;
    }

    // Récupérer l'auteur et le dossier séparément (utiliser le service role client)
    const [authorData, folderData] = await Promise.all([
      authorId
        ? queryClient
            .from("profiles")
            .select("id, email, full_name")
            .eq("id", authorId)
            .single()
        : Promise.resolve({ data: null, error: null }),
      documentData.folder_id
        ? queryClient
            .from("drive_folders")
            .select("id, name, due_at")
            .eq("id", documentData.folder_id)
            .single()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const author = authorData.data;
    const folder = folderData.data;
    const isLearner = learnerIds.includes(authorId || "");

    // Calculer isLate (seulement si due_at existe)
    const isLate = documentData.due_at
      ? new Date(documentData.due_at) < new Date() &&
        (!documentData.submitted_at || new Date(documentData.submitted_at) > new Date(documentData.due_at))
      : false;

    // Formater les dates
    const formatDate = (date: Date | string | null): string => {
      if (!date) return "";
      const d = typeof date === "string" ? new Date(date) : date;
      return d.toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      });
    };

    return {
      id: String(documentData.id),
      title: documentData.title || "Document sans titre",
      author: author?.full_name || author?.email || "Auteur inconnu",
      authorRole: isLearner ? "Apprenant" : author?.email ? "Apprenant" : "Auteur",
      authorEmail: author?.email || "",
      depositedAt: formatDate(documentData.deposited_at || documentData.created_at || documentData.updated_at),
      dueAt: documentData.due_at ? formatDate(documentData.due_at) : null,
      aiUsageScore: Number(documentData.ai_usage_score || 0),
      wordCount: Number(documentData.word_count || 0),
      summary: documentData.summary || null,
      fileUrl: (documentData.file_url && documentData.file_url.trim()) ? documentData.file_url : null,
      isRead: documentData.is_read || false,
      isLate,
      folderId: documentData.folder_id ? String(documentData.folder_id) : null,
      folderName: folder?.name || null,
    };
  } catch (error) {
    console.warn("[formateur] Error fetching drive document by id", error);
    return null;
  }
};
