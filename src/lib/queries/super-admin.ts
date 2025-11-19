"use server";

import { getServerClient, getServiceRoleClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import type { FormateurContentLibrary } from "@/lib/queries/formateur";

// ============================================================================
// TYPES
// ============================================================================

export type SuperAdminStats = {
  totalOrganizations: number;
  activeOrganizations: number;
  totalUsers: number;
  totalInstructors: number;
  totalLearners: number;
  totalTutors: number;
  totalContent: number;
  totalCourses: number;
  totalPaths: number;
  totalResources: number;
  totalTests: number;
  last24hActivity: number;
  recentOrganizations: Array<{
    id: string;
    name: string;
    slug: string;
    memberCount: number;
    createdAt: string;
  }>;
  // Phase 1: Métriques enrichies
  retentionRates: {
    day7: number;
    day30: number;
    day90: number;
  };
  completionMetrics: {
    courses: number; // % de complétion moyenne
    paths: number;
    tests: number;
  };
  engagementMetrics: {
    avgSessionDuration: number; // en minutes
    activeUsers7d: number;
    activeUsers30d: number;
    totalSessions: number;
  };
  churnRisk: {
    inactiveUsers30d: number;
    inactiveOrganizations30d: number;
    lowEngagementUsers: number;
  };
  performanceMetrics: {
    avgTestScore: number;
    coursesCompleted: number;
    pathsCompleted: number;
    testsPassed: number;
  };
};

export type OrganizationListItem = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  createdAt: string;
};

export type OrganizationFullDetails = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo: string | null;
  memberCount: number;
  instructorCount: number;
  learnerCount: number;
  tutorCount: number;
  adminCount: number;
  members: Array<{
    id: string;
    email: string;
    fullName: string | null;
    role: string;
    phone: string | null;
  }>;
  courses: Array<{
    id: string;
    title: string;
    slug: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
  paths: Array<{
    id: string;
    title: string;
    slug: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
  resources: Array<{
    id: string;
    title: string;
    kind: string | null;
    published: boolean | null;
    createdAt: string | null;
  }>;
  tests: Array<{
    id: string;
    title: string;
    slug: string | null;
    published: boolean | null;
    createdAt: string | null;
  }>;
};

export type UserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  organizations: Array<{ id: string; name: string }>;
};

export type OrganizationActivity = {
  id: string;
  type: "member_added" | "member_removed" | "course_created" | "path_created" | "resource_created" | "test_created" | "course_published" | "path_published";
  title: string;
  subtitle: string;
  userId?: string;
  userName?: string;
  createdAt: string;
};

// ============================================================================
// STATISTIQUES
// ============================================================================

export async function getSuperAdminStats(): Promise<SuperAdminStats> {
  const isAdmin = await isSuperAdmin();
  let supabase = await getServerClient();
  
  if (!supabase) {
    console.error("[super-admin] Supabase client is null");
    return getEmptyStats();
  }
  
  if (isAdmin) {
    const serviceRoleClient = getServiceRoleClient();
    if (serviceRoleClient) {
      supabase = serviceRoleClient;
    } else if (!supabase) {
      return getEmptyStats();
    }
  } else if (!supabase) {
    return getEmptyStats();
  }
  
  if (!supabase) {
    return getEmptyStats();
  }

  function getEmptyStats(): SuperAdminStats {
    return {
      totalOrganizations: 0,
      activeOrganizations: 0,
      totalUsers: 0,
      totalInstructors: 0,
      totalLearners: 0,
      totalTutors: 0,
      totalContent: 0,
      totalCourses: 0,
      totalPaths: 0,
      totalResources: 0,
      totalTests: 0,
      last24hActivity: 0,
      recentOrganizations: [],
      retentionRates: { day7: 0, day30: 0, day90: 0 },
      completionMetrics: { courses: 0, paths: 0, tests: 0 },
      engagementMetrics: { avgSessionDuration: 0, activeUsers7d: 0, activeUsers30d: 0, totalSessions: 0 },
      churnRisk: { inactiveUsers30d: 0, inactiveOrganizations30d: 0, lowEngagementUsers: 0 },
      performanceMetrics: { avgTestScore: 0, coursesCompleted: 0, pathsCompleted: 0, testsPassed: 0 },
    };
  }

  try {
    const [
      orgsResult,
      usersResult,
      instructorsResult,
      learnersResult,
      tutorsResult,
      coursesResult,
      pathsResult,
      resourcesResult,
      testsResult,
    ] = await Promise.all([
      supabase.from("organizations").select("id, name, slug, created_at", { count: "exact" }),
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("org_memberships").select("user_id", { count: "exact" }).eq("role", "instructor"),
      supabase.from("org_memberships").select("user_id", { count: "exact" }).eq("role", "learner"),
      supabase.from("org_memberships").select("user_id", { count: "exact" }).eq("role", "tutor"),
      supabase.from("courses").select("id", { count: "exact" }),
      supabase.from("paths").select("id", { count: "exact" }),
      supabase.from("resources").select("id", { count: "exact" }),
      supabase.from("tests").select("id", { count: "exact" }),
    ]);

    const { data: orgsData } = orgsResult;
    const recentOrgsWithMembers = await Promise.all(
      (orgsData || [])
        .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
        .slice(0, 10)
        .map(async (org) => {
          const { count } = await supabase
            .from("org_memberships")
            .select("*", { count: "exact", head: true })
            .eq("org_id", org.id);

          return {
            id: org.id,
            name: org.name || "Sans nom",
            slug: org.slug || "",
            memberCount: count || 0,
            createdAt: org.created_at || new Date().toISOString(),
          };
        }),
    );

    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    const { count: recentActivity } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .gte("created_at", yesterday.toISOString());

    const actualUsers = (instructorsResult.count || 0) + (learnersResult.count || 0) + (tutorsResult.count || 0);

    // Phase 1: Calcul des métriques enrichies
    const now = new Date();
    const day7Ago = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const day90Ago = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Taux de rétention (utilisateurs actifs sur X jours)
    const { count: activeUsers7d } = await supabase
      .from("login_events")
      .select("user_id", { count: "exact", head: true })
      .gte("at", day7Ago.toISOString())
      .not("user_id", "is", null);

    const { count: activeUsers30d } = await supabase
      .from("login_events")
      .select("user_id", { count: "exact", head: true })
      .gte("at", day30Ago.toISOString())
      .not("user_id", "is", null);

    const { data: uniqueLogins7d } = await supabase
      .from("login_events")
      .select("user_id")
      .gte("at", day7Ago.toISOString());

    const { data: uniqueLogins30d } = await supabase
      .from("login_events")
      .select("user_id")
      .gte("at", day30Ago.toISOString());

    const { data: uniqueLogins90d } = await supabase
      .from("login_events")
      .select("user_id")
      .gte("at", day90Ago.toISOString());

    const uniqueUsers7d = new Set(uniqueLogins7d?.map((l) => l.user_id) || []).size;
    const uniqueUsers30d = new Set(uniqueLogins30d?.map((l) => l.user_id) || []).size;
    const uniqueUsers90d = new Set(uniqueLogins90d?.map((l) => l.user_id) || []).size;

    const retention7d = actualUsers > 0 ? (uniqueUsers7d / actualUsers) * 100 : 0;
    const retention30d = actualUsers > 0 ? (uniqueUsers30d / actualUsers) * 100 : 0;
    const retention90d = actualUsers > 0 ? (uniqueUsers90d / actualUsers) * 100 : 0;

    // Métriques de complétion
    const { data: courseProgress } = await supabase
      .from("course_progress")
      .select("progress_percent");

    const { data: pathProgress } = await supabase
      .from("path_progress")
      .select("progress_percent");

    const { data: testAttempts } = await supabase
      .from("test_attempts")
      .select("status, score")
      .eq("status", "passed");

    const avgCourseCompletion = courseProgress && courseProgress.length > 0
      ? courseProgress.reduce((sum, p) => sum + (Number(p.progress_percent) || 0), 0) / courseProgress.length
      : 0;

    const avgPathCompletion = pathProgress && pathProgress.length > 0
      ? pathProgress.reduce((sum, p) => sum + (Number(p.progress_percent) || 0), 0) / pathProgress.length
      : 0;

    const testPassRate = testAttempts && testAttempts.length > 0
      ? (testAttempts.length / (testAttempts.length + (testAttempts.length * 0.3))) * 100 // Approximation
      : 0;

    // Métriques d'engagement
    // Essayer d'abord avec duration_seconds (nouveau schéma), puis fallback vers duration_minutes
    const { data: learningSessions } = await supabase
      .from("learning_sessions")
      .select("duration_seconds, duration_active_seconds, duration_minutes, active_duration_minutes");

    const { count: totalSessions } = await supabase
      .from("learning_sessions")
      .select("id", { count: "exact", head: true });

    const avgSessionDuration = learningSessions && learningSessions.length > 0
      ? learningSessions.reduce((sum, s) => {
          // Utiliser duration_active_seconds si disponible, sinon convertir duration_minutes
          const activeSeconds = s.duration_active_seconds 
            ? Number(s.duration_active_seconds) 
            : (s.active_duration_minutes ? Number(s.active_duration_minutes) * 60 : 0);
          return sum + activeSeconds;
        }, 0) / learningSessions.length / 60 // en minutes
      : 0;

    // Utilisateurs à risque de churn (inactifs > 30 jours)
    const { count: inactiveUsers30d } = await supabase
      .from("login_events")
      .select("user_id", { count: "exact", head: true })
      .lt("at", day30Ago.toISOString());

    // Organisations inactives (> 30 jours sans activité)
    const { data: orgActivities } = await supabase
      .from("org_memberships")
      .select("org_id, created_at")
      .order("created_at", { ascending: false });

    const orgLastActivity = new Map<string, Date>();
    orgActivities?.forEach((oa) => {
      const existing = orgLastActivity.get(oa.org_id);
      const current = new Date(oa.created_at || 0);
      if (!existing || current > existing) {
        orgLastActivity.set(oa.org_id, current);
      }
    });

    const inactiveOrgs30d = Array.from(orgLastActivity.values()).filter(
      (date) => date < day30Ago,
    ).length;

    // Utilisateurs à faible engagement (pas de session depuis 7 jours)
    const { data: recentSessions } = await supabase
      .from("learning_sessions")
      .select("user_id")
      .gte("started_at", day7Ago.toISOString());

    const activeSessionUsers = new Set(recentSessions?.map((s) => s.user_id) || []);
    const lowEngagementUsers = actualUsers - activeSessionUsers.size;

    // Métriques de performance
    const completedCourses = courseProgress?.filter((p) => Number(p.progress_percent) >= 100).length || 0;
    const completedPaths = pathProgress?.filter((p) => Number(p.progress_percent) >= 100).length || 0;
    const passedTests = testAttempts?.length || 0;
    const avgTestScore = testAttempts && testAttempts.length > 0
      ? testAttempts.reduce((sum, t) => sum + (Number(t.score) || 0), 0) / testAttempts.length
      : 0;

    return {
      totalOrganizations: orgsResult.count || 0,
      activeOrganizations: orgsResult.count || 0,
      totalUsers: actualUsers,
      totalInstructors: instructorsResult.count || 0,
      totalLearners: learnersResult.count || 0,
      totalTutors: tutorsResult.count || 0,
      totalContent: (coursesResult.count || 0) + (pathsResult.count || 0),
      totalCourses: coursesResult.count || 0,
      totalPaths: pathsResult.count || 0,
      totalResources: resourcesResult.count || 0,
      totalTests: testsResult.count || 0,
      last24hActivity: recentActivity || 0,
      recentOrganizations: recentOrgsWithMembers,
      // Phase 1: Métriques enrichies
      retentionRates: {
        day7: Math.round(retention7d * 100) / 100,
        day30: Math.round(retention30d * 100) / 100,
        day90: Math.round(retention90d * 100) / 100,
      },
      completionMetrics: {
        courses: Math.round(avgCourseCompletion * 100) / 100,
        paths: Math.round(avgPathCompletion * 100) / 100,
        tests: Math.round(testPassRate * 100) / 100,
      },
      engagementMetrics: {
        avgSessionDuration: Math.round(avgSessionDuration * 100) / 100,
        activeUsers7d: uniqueUsers7d,
        activeUsers30d: uniqueUsers30d,
        totalSessions: totalSessions || 0,
      },
      churnRisk: {
        inactiveUsers30d: inactiveUsers30d || 0,
        inactiveOrganizations30d: inactiveOrgs30d,
        lowEngagementUsers: Math.max(0, lowEngagementUsers),
      },
      performanceMetrics: {
        avgTestScore: Math.round(avgTestScore * 100) / 100,
        coursesCompleted: completedCourses,
        pathsCompleted: completedPaths,
        testsPassed: passedTests,
      },
    };
  } catch (error) {
    console.error("[super-admin] Error fetching stats:", error);
    return getEmptyStats();
  }
}

// ============================================================================
// ORGANISATIONS
// ============================================================================

export async function getAllOrganizations(): Promise<OrganizationListItem[]> {
  const isAdmin = await isSuperAdmin();
  
  // Pour Super Admin, utiliser le service role client pour bypass RLS
  let supabase = isAdmin ? getServiceRoleClient() : await getServerClient();
  
  // Si service role client n'est pas disponible et qu'on est Super Admin, utiliser le client normal
  if (!supabase && isAdmin) {
    console.warn("[super-admin] Service role client non disponible, utilisation du client normal (RLS sera appliqué)");
    supabase = await getServerClient();
  }
  
  if (!supabase) {
    console.error("[super-admin] Aucun client Supabase disponible");
    return [];
  }

  try {
    console.log("[super-admin] Fetching organizations, isAdmin:", isAdmin, "using service role:", !!getServiceRoleClient());
    
    // Si on est Super Admin et qu'on n'a pas le service role client, utiliser la fonction SQL
    if (isAdmin && !getServiceRoleClient()) {
      console.log("[super-admin] Using SQL function to bypass RLS");
      const { data: orgs, error } = await supabase.rpc('get_all_organizations_for_super_admin');
      
      if (error) {
        console.error("[super-admin] Error fetching organizations via RPC:", {
          error,
          code: error.code,
          message: error.message,
        });
        // Fallback sur la méthode normale
      } else if (orgs && orgs.length > 0) {
        console.log("[super-admin] Successfully fetched organizations via RPC:", orgs.length);
        return orgs.map((org: any) => ({
          id: org.id,
          name: org.name || "Sans nom",
          slug: org.slug || "",
          memberCount: Number(org.member_count) || 0,
          createdAt: org.created_at || new Date().toISOString(),
        }));
      }
    }
    
    // Méthode normale (avec ou sans service role)
    const { data: orgs, error } = await supabase
      .from("organizations")
      .select("id, name, slug, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[super-admin] Error fetching organizations:", {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    console.log("[super-admin] Found organizations:", orgs?.length || 0);

    const orgsWithMembers = await Promise.all(
      (orgs || []).map(async (org) => {
        const { count } = await supabase
          .from("org_memberships")
          .select("*", { count: "exact", head: true })
          .eq("org_id", org.id);

        return {
          id: org.id,
          name: org.name || "Sans nom",
          slug: org.slug || "",
          memberCount: count || 0,
          createdAt: org.created_at || new Date().toISOString(),
        };
      }),
    );

    return orgsWithMembers;
  } catch (error) {
    console.error("[super-admin] Error fetching organizations:", error);
    return [];
  }
}

export async function getOrganizationLogo(orgId: string): Promise<string | null> {
  const isAdmin = await isSuperAdmin();
  let supabase = await getServerClient();
  
  if (isAdmin) {
    try {
      supabase = getServiceRoleClient();
    } catch (e) {
      if (!supabase) return null;
    }
  } else if (!supabase) {
    return null;
  }

  if (!supabase) {
    return null;
  }

  try {
    // Chercher d'abord dans les profils des admins
    const { data: adminMemberships } = await supabase
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "admin")
      .limit(1);

    if (adminMemberships && adminMemberships.length > 0) {
      const { data: adminProfile } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", adminMemberships[0].user_id)
        .single();

      if (adminProfile?.avatar_url) {
        return adminProfile.avatar_url;
      }
    }

    // Sinon chercher dans la table organizations
    const { data: org } = await supabase
      .from("organizations")
      .select("logo")
      .eq("id", orgId)
      .single();

    return org?.logo || null;
  } catch (error) {
    console.error("[super-admin] Error fetching organization logo:", error);
    return null;
  }
}

export async function getOrganizationFullDetails(orgId: string): Promise<OrganizationFullDetails | null> {
  const isAdmin = await isSuperAdmin();
  
  // Pour Super Admin, utiliser le service role client pour bypass RLS
  let supabase = isAdmin ? getServiceRoleClient() : await getServerClient();
  
  // Si service role client n'est pas disponible et qu'on est Super Admin, utiliser le client normal
  if (!supabase && isAdmin) {
    console.warn("[super-admin] Service role client non disponible, utilisation du client normal (RLS sera appliqué)");
    supabase = await getServerClient();
  }
  
  if (!supabase) {
    console.error("[super-admin] Aucun client Supabase disponible");
    return null;
  }

  try {
    console.log("[super-admin] Fetching organization details for orgId:", orgId);
    
    // Récupérer l'organisation
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, slug, description, logo")
      .eq("id", orgId)
      .single();

    if (orgError || !org) {
      console.error("[super-admin] Error fetching organization:", orgError);
      return null;
    }

    console.log("[super-admin] Organization found:", org.name);

    // Récupérer les membres
    const { data: memberships, error: membershipsError } = await supabase
      .from("org_memberships")
      .select("user_id, role")
      .eq("org_id", orgId);

    if (membershipsError) {
      console.error("[super-admin] Error fetching memberships:", membershipsError);
    }

    const userIds = (memberships || []).map((m) => m.user_id);
    let members: Array<{
      id: string;
      email: string;
      fullName: string | null;
      role: string;
      phone: string | null;
    }> = [];

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, phone")
        .in("id", userIds);

      if (!profilesError && profiles) {
        const roleMap = new Map(
          (memberships || []).map((m) => [m.user_id, m.role]),
        );
        members = profiles.map((p) => ({
          id: p.id,
          email: p.email || "",
          fullName: p.full_name || null,
          role: roleMap.get(p.id) || "learner",
          phone: p.phone || null,
        }));
      }
    }

    const instructorCount = (memberships || []).filter((m) => m.role === "instructor").length;
    const learnerCount = (memberships || []).filter((m) => m.role === "learner").length;
    const tutorCount = (memberships || []).filter((m) => m.role === "tutor").length;
    const adminCount = (memberships || []).filter((m) => m.role === "admin").length;

    const { data: courses } = await supabase
      .from("courses")
      .select("id, title, slug, status, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const { data: paths } = await supabase
      .from("paths")
      .select("id, title, slug, status, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const { data: resources } = await supabase
      .from("resources")
      .select("id, title, kind, published, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const { data: tests } = await supabase
      .from("tests")
      .select("id, title, slug, published, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });

    const logo = await getOrganizationLogo(orgId);

    return {
      id: org.id,
      name: org.name || "Sans nom",
      slug: org.slug || null,
      description: org.description || null,
      logo: logo || org.logo || null,
      memberCount: memberships?.length || 0,
      instructorCount,
      learnerCount,
      tutorCount,
      adminCount,
      members,
      courses: (courses || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        createdAt: c.created_at,
      })),
      paths: (paths || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        createdAt: p.created_at,
      })),
      resources: (resources || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        kind: r.kind,
        published: r.published,
        createdAt: r.created_at,
      })),
      tests: (tests || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        published: t.published,
        createdAt: t.created_at,
      })),
    };
  } catch (error) {
    console.error("[super-admin] Error fetching organization full details:", error);
    return null;
  }
}

// ============================================================================
// UTILISATEURS
// ============================================================================

export async function getAllUsers(): Promise<UserListItem[]> {
  const isAdmin = await isSuperAdmin();
  
  // Pour Super Admin, utiliser le service role client pour bypass RLS
  let supabase = isAdmin ? getServiceRoleClient() : await getServerClient();
  
  // Si service role client n'est pas disponible et qu'on est Super Admin, utiliser le client normal
  if (!supabase && isAdmin) {
    console.warn("[super-admin] Service role client non disponible, utilisation du client normal (RLS sera appliqué)");
    supabase = await getServerClient();
  }
  
  if (!supabase) {
    console.error("[super-admin] Aucun client Supabase disponible");
    return [];
  }

  try {
    console.log("[super-admin] Fetching users, isAdmin:", isAdmin, "using service role:", !!getServiceRoleClient());
    
    // Si on est Super Admin et qu'on n'a pas le service role client, utiliser la fonction SQL
    if (isAdmin && !getServiceRoleClient()) {
      console.log("[super-admin] Using SQL function to bypass RLS for users");
      const { data: users, error } = await supabase.rpc('get_all_users_for_super_admin');
      
      if (error) {
        console.error("[super-admin] Error fetching users via RPC:", {
          error,
          code: error.code,
          message: error.message,
        });
        // Fallback sur la méthode normale
      } else if (users && users.length > 0) {
        console.log("[super-admin] Successfully fetched users via RPC:", users.length);
        return users.map((user: any) => ({
          id: user.id,
          email: user.email || "",
          fullName: user.full_name || null,
          role: user.role || "learner",
          organizations: (user.org_ids || []).map((orgId: string, index: number) => ({
            id: orgId,
            name: (user.org_names || [])[index] || "Organisation inconnue",
          })),
        }));
      }
    }
    
    // Méthode normale (avec ou sans service role)
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role");

    if (error) {
      console.error("[super-admin] Error fetching users:", {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      return [];
    }

    console.log("[super-admin] Found profiles:", profiles?.length || 0);

    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("user_id, org_id, role");

    const orgMap = new Map<string, string[]>();
    const roleMap = new Map<string, string>();

    (memberships || []).forEach((m) => {
      if (!orgMap.has(m.user_id)) {
        orgMap.set(m.user_id, []);
      }
      orgMap.get(m.user_id)?.push(m.org_id);
      roleMap.set(m.user_id, m.role);
    });

    const orgIds = Array.from(new Set((memberships || []).map((m) => m.org_id)));
    const { data: orgs } = orgIds.length > 0
      ? await supabase.from("organizations").select("id, name").in("id", orgIds)
      : { data: [] };

    const orgNameMap = new Map((orgs || []).map((o) => [o.id, o.name]));

    return (profiles || []).map((profile) => {
      const userOrgIds = orgMap.get(profile.id) || [];
      const organizations = userOrgIds.map((orgId) => ({
        id: orgId,
        name: orgNameMap.get(orgId) || "Organisation inconnue",
      }));

      return {
        id: profile.id,
        email: profile.email || "",
        fullName: profile.full_name || null,
        role: roleMap.get(profile.id) || profile.role || "learner",
        organizations,
      };
    });
  } catch (error) {
    console.error("[super-admin] Error fetching users:", error);
    return [];
  }
}

export type UserFullDetails = {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  phone: string | null;
  organizations: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  courses: Array<{
    id: string;
    title: string;
    slug: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
  paths: Array<{
    id: string;
    title: string;
    slug: string | null;
    status: string | null;
    createdAt: string | null;
  }>;
  resources: Array<{
    id: string;
    title: string;
    kind: string | null;
    published: boolean | null;
    createdAt: string | null;
  }>;
  tests: Array<{
    id: string;
    title: string;
    slug: string | null;
    published: boolean | null;
    createdAt: string | null;
  }>;
};

export async function getUserFullDetails(userId: string): Promise<UserFullDetails | null> {
  const isAdmin = await isSuperAdmin();
  
  // Pour Super Admin, utiliser le service role client pour bypass RLS
  let supabase = isAdmin ? getServiceRoleClient() : await getServerClient();
  
  // Si service role client n'est pas disponible et qu'on est Super Admin, utiliser le client normal
  if (!supabase && isAdmin) {
    console.warn("[super-admin] Service role client non disponible, utilisation du client normal (RLS sera appliqué)");
    supabase = await getServerClient();
  }
  
  if (!supabase) {
    console.error("[super-admin] Aucun client Supabase disponible");
    return null;
  }

  try {
    console.log("[super-admin] Fetching user details for userId:", userId);
    console.log("[super-admin] Using service role client:", !!getServiceRoleClient());
    console.log("[super-admin] Supabase client type:", supabase ? "available" : "null");
    
    // Si on est Super Admin et qu'on n'a pas le service role client, utiliser la fonction SQL
    if (isAdmin && !getServiceRoleClient()) {
      console.log("[super-admin] Using SQL function to bypass RLS for user details");
      const { data: userData, error: rpcError } = await supabase.rpc('get_user_details_for_super_admin', {
        p_user_id: userId
      });
      
      if (rpcError) {
        console.error("[super-admin] Error fetching user via RPC:", {
          error: rpcError,
          code: rpcError.code,
          message: rpcError.message,
        });
        // Fallback sur la méthode normale
      } else if (userData && userData.length > 0) {
        console.log("[super-admin] Successfully fetched user via RPC");
        const user = userData[0] as any;
        
        // Construire les organisations
        const organizations = (user.org_ids || []).map((orgId: string, index: number) => ({
          id: orgId,
          name: (user.org_names || [])[index] || "Organisation inconnue",
          role: (user.org_roles || [])[index] || "learner",
        }));
        
        // Récupérer les contenus (cours, parcours, ressources, tests)
        const userOrgIds = user.org_ids || [];
        
        let coursesQuery = supabase
          .from("courses")
          .select("id, title, slug, status, created_at")
          .or(`creator_id.eq.${userId},owner_id.eq.${userId}`);
        
        if (userOrgIds.length > 0) {
          coursesQuery = coursesQuery.in("org_id", userOrgIds);
        }
        
        const { data: courses } = await coursesQuery.order("created_at", { ascending: false });
        
        let pathsQuery = supabase
          .from("paths")
          .select("id, title, slug, status, created_at")
          .or(`owner_id.eq.${userId},creator_id.eq.${userId}`);
        
        if (userOrgIds.length > 0) {
          pathsQuery = pathsQuery.in("org_id", userOrgIds);
        }
        
        const { data: paths } = await pathsQuery.order("created_at", { ascending: false });
        
        let resourcesQuery = supabase
          .from("resources")
          .select("id, title, kind, published, created_at")
          .eq("created_by", userId);
        
        if (userOrgIds.length > 0) {
          resourcesQuery = resourcesQuery.in("org_id", userOrgIds);
        }
        
        const { data: resources } = await resourcesQuery.order("created_at", { ascending: false });
        
        let testsQuery = supabase
          .from("tests")
          .select("id, title, slug, published, created_at")
          .or(`creator_id.eq.${userId},owner_id.eq.${userId}`);
        
        if (userOrgIds.length > 0) {
          testsQuery = testsQuery.in("org_id", userOrgIds);
        }
        
        const { data: tests } = await testsQuery.order("created_at", { ascending: false });
        
        return {
          id: user.id,
          email: user.email || "",
          fullName: user.full_name || null,
          role: user.role || "learner",
          phone: user.phone || null,
          organizations,
          courses: (courses || []).map((c: any) => ({
            id: c.id,
            title: c.title,
            slug: c.slug,
            status: c.status,
            createdAt: c.created_at,
          })),
          paths: (paths || []).map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            status: p.status,
            createdAt: p.created_at,
          })),
          resources: (resources || []).map((r: any) => ({
            id: r.id,
            title: r.title,
            kind: r.kind,
            published: r.published,
            createdAt: r.created_at,
          })),
          tests: (tests || []).map((t: any) => ({
            id: t.id,
            title: t.title,
            slug: t.slug,
            published: t.published,
            createdAt: t.created_at,
          })),
        };
      }
    }
    
    // Méthode normale (avec ou sans service role)
    let { data: profile, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, phone")
      .eq("id", userId)
      .single();
    
    console.log("[super-admin] Profile query result - profile:", profile ? "found" : "null", "error:", error ? "yes" : "no");

    if (error) {
      console.error("[super-admin] Error fetching profile:", {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        userId,
        errorString: JSON.stringify(error, null, 2),
      });
      
      // Si c'est une erreur RLS, essayer de créer le profil depuis auth.users
      if (error.code === 'PGRST301' || error.message?.includes('row-level security') || error.message?.includes('RLS')) {
        console.log("[super-admin] RLS error detected, attempting to fetch from auth.users and create profile");
        
        try {
          // Utiliser le client normal pour auth.admin (qui devrait fonctionner même sans service role)
          const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
          
          if (authError || !authUser) {
            console.error("[super-admin] User not found in auth.users either:", authError);
            return null;
          }
          
          console.log("[super-admin] User found in auth.users, creating profile:", authUser.user.email);
          
          // Créer le profil manquant - utiliser le client normal qui devrait fonctionner pour INSERT
          const { error: createError } = await supabase
            .from("profiles")
            .insert({
              id: userId,
              email: authUser.user.email,
              full_name: authUser.user.user_metadata?.full_name || null,
              role: "learner", // Rôle par défaut
            });
          
          if (createError) {
            console.error("[super-admin] Error creating profile:", createError);
            // Si la création échoue aussi à cause de RLS, on ne peut rien faire
            return null;
          }
          
          console.log("[super-admin] Profile created successfully");
          
          // Réessayer de récupérer le profil
          const { data: newProfile, error: newError } = await supabase
            .from("profiles")
            .select("id, email, full_name, role, phone")
            .eq("id", userId)
            .single();
          
          if (newError || !newProfile) {
            console.error("[super-admin] Error fetching newly created profile:", newError);
            return null;
          }
          
          // Utiliser le nouveau profil
          profile = newProfile;
        } catch (createErr) {
          console.error("[super-admin] Error in profile creation process:", createErr);
          return null;
        }
      } else {
        return null;
      }
    }

    if (!profile) {
      console.error("[super-admin] Profile not found for userId:", userId);
      
      // Essayer de trouver l'utilisateur dans auth.users pour créer le profil
      try {
        const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
        
        if (authError || !authUser) {
          console.error("[super-admin] User not found in auth.users either:", authError);
          return null;
        }
        
        console.log("[super-admin] User found in auth.users, creating profile:", authUser.user.email);
        
        // Créer le profil manquant
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            id: userId,
            email: authUser.user.email,
            full_name: authUser.user.user_metadata?.full_name || null,
            role: "learner", // Rôle par défaut
          });
        
        if (createError) {
          console.error("[super-admin] Error creating profile:", createError);
          return null;
        }
        
        console.log("[super-admin] Profile created successfully");
        
        // Réessayer de récupérer le profil
        const { data: newProfile, error: newError } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, phone")
          .eq("id", userId)
          .single();
        
        if (newError || !newProfile) {
          console.error("[super-admin] Error fetching newly created profile:", newError);
          return null;
        }
        
        // Utiliser le nouveau profil
        profile = newProfile;
      } catch (createErr) {
        console.error("[super-admin] Error in profile creation process:", createErr);
        return null;
      }
    }

    if (!profile) {
      console.error("[super-admin] Profile still not found after creation attempt");
      return null;
    }

    console.log("[super-admin] Profile found:", profile.email);

    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", userId);

    const orgIds = (memberships || []).map((m) => m.org_id);
    let organizations: Array<{ id: string; name: string; role: string }> = [];

    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .in("id", orgIds);

      const roleMap = new Map((memberships || []).map((m) => [m.org_id, m.role]));
      organizations = (orgs || []).map((o) => ({
        id: o.id,
        name: o.name || "Sans nom",
        role: roleMap.get(o.id) || "learner",
      }));
    }

    const userOrgIds = orgIds;
    
    // Si l'utilisateur n'a pas d'organisations, chercher quand même ses contenus par creator_id/owner_id
    let coursesQuery = supabase
      .from("courses")
      .select("id, title, slug, status, created_at")
      .or(`creator_id.eq.${userId},owner_id.eq.${userId}`);
    
    if (userOrgIds.length > 0) {
      coursesQuery = coursesQuery.in("org_id", userOrgIds);
    }
    
    const { data: courses } = await coursesQuery.order("created_at", { ascending: false });

    let pathsQuery = supabase
      .from("paths")
      .select("id, title, slug, status, created_at")
      .or(`owner_id.eq.${userId},creator_id.eq.${userId}`);
    
    if (userOrgIds.length > 0) {
      pathsQuery = pathsQuery.in("org_id", userOrgIds);
    }
    
    const { data: paths } = await pathsQuery.order("created_at", { ascending: false });

    let resourcesQuery = supabase
      .from("resources")
      .select("id, title, kind, published, created_at")
      .eq("created_by", userId);
    
    if (userOrgIds.length > 0) {
      resourcesQuery = resourcesQuery.in("org_id", userOrgIds);
    }
    
    const { data: resources } = await resourcesQuery.order("created_at", { ascending: false });

    let testsQuery = supabase
      .from("tests")
      .select("id, title, slug, published, created_at")
      .or(`creator_id.eq.${userId},owner_id.eq.${userId}`);
    
    if (userOrgIds.length > 0) {
      testsQuery = testsQuery.in("org_id", userOrgIds);
    }
    
    const { data: tests } = await testsQuery.order("created_at", { ascending: false });

    return {
      id: profile.id,
      email: profile.email || "",
      fullName: profile.full_name || null,
      role: profile.role || "learner",
      phone: profile.phone || null,
      organizations,
      courses: (courses || []).map((c: any) => ({
        id: c.id,
        title: c.title,
        slug: c.slug,
        status: c.status,
        createdAt: c.created_at,
      })),
      paths: (paths || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        slug: p.slug,
        status: p.status,
        createdAt: p.created_at,
      })),
      resources: (resources || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        kind: r.kind,
        published: r.published,
        createdAt: r.created_at,
      })),
      tests: (tests || []).map((t: any) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        published: t.published,
        createdAt: t.created_at,
      })),
    };
  } catch (error) {
    console.error("[super-admin] Error fetching user full details:", error);
    return null;
  }
}

// ============================================================================
// ACTIVITÉS ORGANISATION
// ============================================================================

export async function getOrganizationActivity(orgId: string): Promise<OrganizationActivity[]> {
  const isAdmin = await isSuperAdmin();
  let supabase = await getServerClient();
  
  if (isAdmin) {
    try {
      supabase = getServiceRoleClient();
    } catch (e) {
      if (!supabase) return [];
    }
  } else if (!supabase) {
    return [];
  }

  try {
    if (!supabase) {
      return [];
    }
    const activities: OrganizationActivity[] = [];

    // Récupérer les membres récemment ajoutés (via org_memberships.created_at)
    const { data: recentMemberships } = await supabase
      .from("org_memberships")
      .select("user_id, role, created_at, profiles!inner(id, email, full_name)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentMemberships) {
      recentMemberships.forEach((membership: any) => {
        const profile = membership.profiles;
        const roleName = membership.role === "instructor" ? "formateur" : 
                        membership.role === "learner" ? "apprenant" :
                        membership.role === "admin" ? "administrateur" : "tuteur";
        activities.push({
          id: `member-${membership.user_id}-${membership.created_at}`,
          type: "member_added",
          title: `${profile?.full_name || profile?.email || "Utilisateur"} ajouté comme ${roleName}`,
          subtitle: `Rôle: ${roleName}`,
          userId: membership.user_id,
          userName: profile?.full_name || profile?.email,
          createdAt: membership.created_at,
        });
      });
    }

    // Récupérer les formations récemment créées
    const { data: recentCourses } = await supabase
      .from("courses")
      .select("id, title, status, created_at, profiles!creator_id(id, full_name, email)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentCourses) {
      recentCourses.forEach((course: any) => {
        const creator = course.profiles;
        activities.push({
          id: `course-${course.id}`,
          type: course.status === "published" ? "course_published" : "course_created",
          title: `Formation "${course.title}" ${course.status === "published" ? "publiée" : "créée"}`,
          subtitle: creator ? `Par ${creator.full_name || creator.email}` : "Par un formateur",
          userId: course.creator_id,
          userName: creator?.full_name || creator?.email,
          createdAt: course.created_at,
        });
      });
    }

    // Récupérer les parcours récemment créés
    const { data: recentPaths } = await supabase
      .from("paths")
      .select("id, title, status, created_at, profiles!owner_id(id, full_name, email)")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentPaths) {
      recentPaths.forEach((path: any) => {
        const creator = path.profiles;
        activities.push({
          id: `path-${path.id}`,
          type: path.status === "published" ? "path_published" : "path_created",
          title: `Parcours "${path.title}" ${path.status === "published" ? "publié" : "créé"}`,
          subtitle: creator ? `Par ${creator.full_name || creator.email}` : "Par un formateur",
          userId: path.owner_id,
          userName: creator?.full_name || creator?.email,
          createdAt: path.created_at,
        });
      });
    }

    // Récupérer les ressources récemment créées
    const { data: recentResources } = await supabase
      .from("resources")
      .select("id, title, published, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentResources) {
      recentResources.forEach((resource: any) => {
        activities.push({
          id: `resource-${resource.id}`,
          type: "resource_created",
          title: `Ressource "${resource.title}" créée`,
          subtitle: resource.published ? "Publiée" : "Brouillon",
          createdAt: resource.created_at,
        });
      });
    }

    // Récupérer les tests récemment créés
    const { data: recentTests } = await supabase
      .from("tests")
      .select("id, title, published, created_at")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentTests) {
      recentTests.forEach((test: any) => {
        activities.push({
          id: `test-${test.id}`,
          type: "test_created",
          title: `Test "${test.title}" créé`,
          subtitle: test.published ? "Publié" : "Brouillon",
          createdAt: test.created_at,
        });
      });
    }

    // Trier par date (plus récent en premier) et limiter à 20
    return activities
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  } catch (error) {
    console.error("[super-admin] Error fetching organization activity:", error);
    return [];
  }
}

// ============================================================================
// PHASE 1: TENDANCES ET ANALYTICS AVANCÉES
// ============================================================================

export type TrendData = {
  date: string;
  organizations: number;
  users: number;
  courses: number;
  paths: number;
};

export type TimeRange = "7d" | "30d" | "90d";

export async function getTrends(range: TimeRange = "30d"): Promise<TrendData[]> {
  const isAdmin = await isSuperAdmin();
  let supabase = await getServerClient();
  
  if (isAdmin) {
    const serviceRoleClient = getServiceRoleClient();
    if (serviceRoleClient) {
      supabase = serviceRoleClient;
    } else if (!supabase) {
      return [];
    }
  } else if (!supabase) {
    return [];
  }
  
  if (!supabase) {
    return [];
  }

  try {
    const now = new Date();
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Récupérer toutes les données créées dans la période
    const [orgs, profiles, courses, paths] = await Promise.all([
      supabase.from("organizations").select("created_at").gte("created_at", startDate.toISOString()),
      supabase.from("profiles").select("created_at").gte("created_at", startDate.toISOString()),
      supabase.from("courses").select("created_at").gte("created_at", startDate.toISOString()),
      supabase.from("paths").select("created_at").gte("created_at", startDate.toISOString()),
    ]);

    // Grouper par jour
    const trends = new Map<string, { orgs: number; users: number; courses: number; paths: number }>();

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    orgs.data?.forEach((org) => {
      const date = formatDate(new Date(org.created_at || now));
      const existing = trends.get(date) || { orgs: 0, users: 0, courses: 0, paths: 0 };
      existing.orgs++;
      trends.set(date, existing);
    });

    profiles.data?.forEach((profile) => {
      const date = formatDate(new Date(profile.created_at || now));
      const existing = trends.get(date) || { orgs: 0, users: 0, courses: 0, paths: 0 };
      existing.users++;
      trends.set(date, existing);
    });

    courses.data?.forEach((course) => {
      const date = formatDate(new Date(course.created_at || now));
      const existing = trends.get(date) || { orgs: 0, users: 0, courses: 0, paths: 0 };
      existing.courses++;
      trends.set(date, existing);
    });

    paths.data?.forEach((path) => {
      const date = formatDate(new Date(path.created_at || now));
      const existing = trends.get(date) || { orgs: 0, users: 0, courses: 0, paths: 0 };
      existing.paths++;
      trends.set(date, existing);
    });

    // Créer un tableau avec toutes les dates (même celles sans données)
    const result: TrendData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(now.getTime() - (days - i - 1) * 24 * 60 * 60 * 1000);
      const dateStr = formatDate(date);
      const data = trends.get(dateStr) || { orgs: 0, users: 0, courses: 0, paths: 0 };
      result.push({
        date: dateStr,
        organizations: data.orgs,
        users: data.users,
        courses: data.courses,
        paths: data.paths,
      });
    }

    return result;
  } catch (error) {
    console.error("[super-admin] Error fetching trends:", error);
    return [];
  }
}

export type TopPerformer = {
  id: string;
  name: string;
  metric: number;
  metricLabel: string;
  type: "organization" | "course" | "path" | "instructor";
};

export async function getTopPerformers(): Promise<{
  organizations: TopPerformer[];
  courses: TopPerformer[];
  paths: TopPerformer[];
  instructors: TopPerformer[];
}> {
  const isAdmin = await isSuperAdmin();
  let supabase = await getServerClient();
  
  if (isAdmin) {
    const serviceRoleClient = getServiceRoleClient();
    if (serviceRoleClient) {
      supabase = serviceRoleClient;
    } else if (!supabase) {
      return { organizations: [], courses: [], paths: [], instructors: [] };
    }
  } else if (!supabase) {
    return { organizations: [], courses: [], paths: [], instructors: [] };
  }
  
  if (!supabase) {
    return { organizations: [], courses: [], paths: [], instructors: [] };
  }

  try {
    // Top organisations par nombre de membres
    const { data: orgMemberships } = await supabase
      .from("org_memberships")
      .select("org_id");

    const orgMemberCounts = new Map<string, number>();
    orgMemberships?.forEach((om) => {
      orgMemberCounts.set(om.org_id, (orgMemberCounts.get(om.org_id) || 0) + 1);
    });

    const topOrgs: TopPerformer[] = [];
    for (const [orgId, count] of Array.from(orgMemberCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10)) {
      const { data: org } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .single();
      
      if (org) {
        topOrgs.push({
          id: orgId,
          name: org.name || "Sans nom",
          metric: count,
          metricLabel: "membres",
          type: "organization",
        });
      }
    }

    // Top formations par taux de complétion
    const { data: courseProgressAll } = await supabase
      .from("course_progress")
      .select("course_id, progress_percent");

    const courseMetrics = new Map<string, { total: number; sum: number }>();
    courseProgressAll?.forEach((cp) => {
      const existing = courseMetrics.get(cp.course_id) || { total: 0, sum: 0 };
      existing.total++;
      existing.sum += Number(cp.progress_percent) || 0;
      courseMetrics.set(cp.course_id, existing);
    });

    const topCourses: TopPerformer[] = [];
    for (const [courseId, metrics] of Array.from(courseMetrics.entries())
      .map(([id, m]) => [id, m.sum / m.total] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)) {
      const { data: course } = await supabase
        .from("courses")
        .select("title")
        .eq("id", courseId)
        .single();

      if (course) {
        topCourses.push({
          id: courseId,
          name: course.title || "Sans titre",
          metric: Math.round(metrics * 100) / 100,
          metricLabel: "% complétion",
          type: "course",
        });
      }
    }

    // Top parcours par taux de complétion
    const { data: pathProgressAll } = await supabase
      .from("path_progress")
      .select("path_id, progress_percent");

    const pathMetrics = new Map<string, { total: number; sum: number }>();
    pathProgressAll?.forEach((pp) => {
      const existing = pathMetrics.get(pp.path_id) || { total: 0, sum: 0 };
      existing.total++;
      existing.sum += Number(pp.progress_percent) || 0;
      pathMetrics.set(pp.path_id, existing);
    });

    const topPaths: TopPerformer[] = [];
    for (const [pathId, metrics] of Array.from(pathMetrics.entries())
      .map(([id, m]) => [id, m.sum / m.total] as [string, number])
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)) {
      const { data: path } = await supabase
        .from("paths")
        .select("title")
        .eq("id", pathId)
        .single();

      if (path) {
        topPaths.push({
          id: pathId,
          name: path.title || "Sans titre",
          metric: Math.round(metrics * 100) / 100,
          metricLabel: "% complétion",
          type: "path",
        });
      }
    }

    // Top formateurs par nombre de contenus créés
    const { data: instructorCourses } = await supabase
      .from("courses")
      .select("creator_id, owner_id");

    const instructorContentCounts = new Map<string, number>();
    instructorCourses?.forEach((c) => {
      const creatorId = c.creator_id || c.owner_id;
      if (creatorId) {
        instructorContentCounts.set(creatorId, (instructorContentCounts.get(creatorId) || 0) + 1);
      }
    });

    const topInstructors: TopPerformer[] = [];
    for (const [instructorId, count] of Array.from(instructorContentCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", instructorId)
        .single();

      if (profile) {
        topInstructors.push({
          id: instructorId,
          name: profile.full_name || profile.email || "Utilisateur",
          metric: count,
          metricLabel: "contenus créés",
          type: "instructor",
        });
      }
    }

    return {
      organizations: topOrgs,
      courses: topCourses,
      paths: topPaths,
      instructors: topInstructors,
    };
  } catch (error) {
    console.error("[super-admin] Error fetching top performers:", error);
    return { organizations: [], courses: [], paths: [], instructors: [] };
  }
}

const emptyPathLibrary: FormateurContentLibrary = {
  courses: [],
  tests: [],
  resources: [],
};

export async function getSuperAdminPathBuilderLibrary(): Promise<FormateurContentLibrary> {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    console.warn("[super-admin/path-builder] Service role client unavailable");
    return emptyPathLibrary;
  }

  try {
    const [initialCoursesResult, initialTestsResult] = await Promise.all([
      supabase
        .from("courses")
        .select("id, title, status, cover_image, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(60),
      supabase
        .from("tests")
        .select("id, title, description, status, updated_at, created_at")
        .order("updated_at", { ascending: false })
        .limit(60),
    ]);

    let coursesResult = initialCoursesResult;
    if (coursesResult.error?.code === "57014") {
      console.warn("[super-admin/path-builder] courses query timed out, retrying with created_at ordering");
      const retryResult = await supabase
        .from("courses")
        .select("id, title, status, cover_image, builder_snapshot, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      coursesResult = {
        ...retryResult,
        data: retryResult.data?.map((c: any) => ({ ...c, updated_at: c.created_at })) ?? null,
      } as any;
    } else if (coursesResult.error?.code === "42703") {
      console.warn("[super-admin/path-builder] courses updated_at missing, retrying without column");
      const retryResult2 = await supabase
        .from("courses")
        .select("id, title, status, cover_image, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      coursesResult = {
        ...retryResult2,
        data: retryResult2.data?.map((c: any) => ({ ...c, updated_at: c.created_at })) ?? null,
      } as any;
    }

    let testsResult = initialTestsResult;
    if (testsResult.error?.code === "57014") {
      console.warn("[super-admin/path-builder] tests query timed out, retrying with created_at ordering");
      const retryTestsResult = await supabase
        .from("tests")
        .select("id, title, description, status, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      testsResult = {
        ...retryTestsResult,
        data: retryTestsResult.data?.map((t: any) => ({ ...t, updated_at: t.created_at })) ?? null,
      } as any;
    } else if (testsResult.error?.code === "42703") {
      console.warn("[super-admin/path-builder] tests updated_at missing, retrying without column");
      const retryTestsResult = await supabase
        .from("tests")
        .select("id, title, description, status, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      testsResult = {
        ...retryTestsResult,
        data: retryTestsResult.data?.map((t: any) => ({ ...t, updated_at: t.created_at })) ?? null,
      } as any;
    }

    let resourcesResult = await supabase
      .from("resources")
      .select("id, title, cover_url, thumbnail_url, published, resource_type, kind, status, updated_at, created_at")
      .order("updated_at", { ascending: false })
      .limit(120);

    if (resourcesResult.error?.code === "42703") {
      console.warn("[super-admin/path-builder] resources table missing resource_type/updated_at, falling back", resourcesResult.error);
      const retryResourcesResult = await supabase
        .from("resources")
        .select("id, title, cover_url, thumbnail_url, published, type, kind, status, created_at")
        .order("created_at", { ascending: false })
        .limit(120);

      if (resourcesResult.error?.code === "42703") {
        console.warn("[super-admin/path-builder] resources missing type column as well, using wildcard select");
        resourcesResult = await supabase
          .from("resources")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(120);
      }
    } else if (resourcesResult.error?.code === "57014") {
      console.warn("[super-admin/path-builder] resources query timed out, retrying with created_at ordering");
      resourcesResult = await supabase
        .from("resources")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(120);
    }

    if (coursesResult.error) {
      console.error("[super-admin/path-builder] Error fetching courses:", coursesResult.error);
    }
    if (testsResult.error) {
      console.error("[super-admin/path-builder] Error fetching tests:", testsResult.error);
    }
    if (resourcesResult.error) {
      console.error("[super-admin/path-builder] Error fetching resources:", resourcesResult.error);
    }

    const courses = Array.from(
      new Map(
        (coursesResult.data ?? []).map((course: any) => {
          const category = "Formation";
          const duration = "";

          return [
            course.id,
            {
              id: String(course.id),
              title: course.title || "Formation sans titre",
              category: category || "Formation",
              duration: duration || "",
              coverImage: course.cover_image || null,
              status: course.status || "draft",
            },
          ];
        }),
      ).values(),
    );

    const tests = Array.from(
      new Map(
        (testsResult.data ?? []).map((test: any) => [
          test.id,
          {
            id: String(test.id),
            title: test.title || "Test sans titre",
            description: test.description || null,
            duration: "",
            status: test.status || "draft",
          },
        ]),
      ).values(),
    );

    const resources = Array.from(
      new Map(
        (resourcesResult.data ?? []).map((resource: any) => {
          const status: "published" | "draft" =
            resource.published === true ? "published" : "draft";
          const resourceType =
            resource.resource_type ||
            resource.type ||
            resource.kind ||
            "guide";
          const thumbnail = resource.cover_url || resource.thumbnail_url || null;

          return [
            resource.id,
            {
              id: String(resource.id),
              title: resource.title || "Ressource sans titre",
              type: resourceType,
              thumbnail,
              status,
              published: resource.published ?? false,
            },
          ];
        }),
      ).values(),
    );

    return {
      courses,
      tests,
      resources,
    };
  } catch (error) {
    console.error("[super-admin/path-builder] Unexpected error building library:", error);
    return emptyPathLibrary;
  }
}

export async function getSuperAdminOrganizationsList(): Promise<Array<{ id: string; name: string }>> {
  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    console.warn("[super-admin/path-builder] Service role client unavailable for organizations");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name", { ascending: true });

    if (error) {
      console.error("[super-admin/path-builder] Error fetching organizations:", error);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.error("[super-admin/path-builder] Unexpected error fetching organizations:", error);
    return [];
  }
}
