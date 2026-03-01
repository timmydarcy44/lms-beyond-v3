// Admin dashboard data helpers
// All data is filtered by the admin's organization

import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { formatDistanceToNowStrict, subDays } from "date-fns";

/**
 * Get the organization ID for the current admin user
 */
async function getAdminOrgId(): Promise<string | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1)
      .single();

    return membership?.org_id || null;
  } catch (error) {
    console.error("[admin] Error fetching admin org_id:", error);
    return null;
  }
}

/**
 * Get the Super Admin user ID (timdarcypro@gmail.com)
 * Uses multiple fallback methods to ensure we find it
 */
export async function getSuperAdminId(): Promise<string | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  try {
    // Méthode 1: Chercher dans super_admins
    const { data: superAdmins } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("is_active", true);
    
    if (superAdmins && superAdmins.length > 0) {
      return superAdmins[0].user_id;
    }
    
    // Méthode 2: Chercher dans profiles par email
    const { data: superAdminProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("email", "timdarcypro@gmail.com")
      .maybeSingle();
    
    if (superAdminProfile?.id) {
      return superAdminProfile.id;
    }
    
    // Méthode 3: Utiliser getServiceRoleClient pour bypass RLS
    const serviceClient = getServiceRoleClient();
    
    if (serviceClient) {
      const { data: serviceSuperAdmins } = await serviceClient
        .from("super_admins")
        .select("user_id")
        .eq("is_active", true)
        .limit(1);
      
      if (serviceSuperAdmins && serviceSuperAdmins.length > 0) {
        return serviceSuperAdmins[0].user_id;
      }
      
      // Dernière tentative: chercher dans auth.users via service client
      const { data: authUsers } = await serviceClient.auth.admin.listUsers();
      const superAdminUser = authUsers?.users?.find(u => u.email === "timdarcypro@gmail.com");
      if (superAdminUser?.id) {
        return superAdminUser.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error("[admin] Error fetching Super Admin ID:", error);
    return null;
  }
}

// ============================================================================
// TYPES
// ============================================================================

export type AdminKpiResult = {
  totalCourses: number;
  totalLearners: number;
  totalInstructors: number;
  totalPaths: number;
  last24hLogins: number;
  last7dBadges: number;
};

export type AdminLearner = {
  id: string;
  fullName: string | null;
  email: string | null;
  status?: "actif" | "en attente" | "suspendu" | null;
  groups: Array<{ id: string; name: string }>;
};

export type AdminGroup = {
  id: string;
  name: string;
  memberCount: number;
  orgName: string | null;
};

export type AdminOrganization = {
  id: string;
  name: string;
};

export type AdminAssignableCatalog = {
  organizations: AdminOrganization[];
  groups: { id: string; name: string }[];
  courses: { 
    id: string; 
    title: string; 
    status?: string | null;
    slug?: string | null;
    creator_id?: string | null; 
    owner_id?: string | null;
    cover_image?: string | null;
    cover_url?: string | null;
    hero_image_url?: string | null;
    thumbnail_url?: string | null;
  }[];
  paths: { 
    id: string; 
    title: string; 
    status?: string | null;
    slug?: string | null;
    creator_id?: string | null;
    owner_id?: string | null;
    thumbnail_url?: string | null;
    hero_url?: string | null;
  }[];
  resources: { 
    id: string; 
    title: string; 
    type?: string | null; 
    status?: string | null;
    slug?: string | null;
    created_by?: string | null;
    owner_id?: string | null;
    cover_url?: string | null;
    thumbnail_url?: string | null;
  }[];
  tests: { 
    id: string; 
    title: string; 
    status?: string | null;
    slug?: string | null;
    created_by?: string | null;
    owner_id?: string | null;
    cover_image?: string | null;
    thumbnail_url?: string | null;
  }[];
};

export type ActivityFeedItem = {
  id: string;
  type: "login" | "enrollment" | "badge" | "publish";
  title: string;
  subtitle?: string;
  created_at: string;
};

export type QualiopiLearnerSummary = {
  id: string;
  fullName: string | null;
  email: string | null;
  groups: Array<{ id: string; name: string }>;
  totalDurationSeconds: number;
  activeDurationSeconds: number;
  coursesFollowed: number;
  averageCompletion: number;
  completionSampleCount: number;
  testsTaken: number;
  testsAverageScore: number | null;
  badgesCount: number;
  lastActivityAt: string | null;
};

export type QualiopiLearnerPublicSummary = Omit<QualiopiLearnerSummary, "completionSampleCount">;

export type QualiopiGroupSummary = {
  id: string;
  name: string;
  memberCount: number;
  totalDurationSeconds: number;
  activeDurationSeconds: number;
  coursesFollowed: number;
  averageCompletion: number;
  averageScore: number | null;
  testsTaken: number;
  badgesCount: number;
  learners: QualiopiLearnerPublicSummary[];
};

export type QualiopiOverview = {
  groups: QualiopiGroupSummary[];
  learners: QualiopiLearnerPublicSummary[];
};

// No fallback data - return zeros if no data
const emptyKpis: AdminKpiResult = {
  totalCourses: 0,
  totalLearners: 0,
  totalInstructors: 0,
  totalPaths: 0,
  last24hLogins: 0,
  last7dBadges: 0,
};

const fallbackAssignableCatalog: AdminAssignableCatalog = {
  organizations: [],
  groups: [],
  courses: [],
  paths: [],
  resources: [],
  tests: [],
};

const emptyQualiopiOverview: QualiopiOverview = {
  groups: [],
  learners: [],
};

// ============================================================================
// KPIs
// ============================================================================

export const getKpis = async (): Promise<AdminKpiResult> => {
  const orgId = await getAdminOrgId();
  
  if (!orgId) {
    console.warn("[admin|getKpis] No organization found for admin");
    return emptyKpis;
  }

  let supabase;
  try {
    supabase = getServiceRoleClient();
  } catch (error) {
    console.warn("[admin|getKpis] Service client unavailable", error);
    return emptyKpis;
  }

  if (!supabase) {
    return emptyKpis;
  }

  try {
    // Get courses assigned to the organization
    const { count: coursesCount } = await supabase
      .from("courses")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);
    
    // Get learners (students) in the organization
    const { count: learnersCount } = await supabase
      .from("org_memberships")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("role", "student");
    
    // Get instructors in the organization
    const { count: instructorsCount } = await supabase
      .from("org_memberships")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId)
      .eq("role", "instructor");
    
    // Get paths assigned to the organization
    const { count: pathsCount } = await supabase
      .from("paths")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId);
    
    // Get login events for organization members (last 24h)
    // First, get all user IDs in the organization
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", orgId);
    
    const userIds = memberships?.map(m => m.user_id) || [];
    let loginCount = 0;
    let badgeCount = 0;
    
    if (userIds.length > 0) {
      const yesterday = subDays(new Date(), 1).toISOString();
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { count: loginCountResult } = await supabase
        .from("login_events")
        .select("*", { count: "exact", head: true })
        .in("user_id", userIds)
        .gte("created_at", yesterday);
      
      loginCount = loginCountResult || 0;
      
      const { count: badgeCountResult } = await supabase
        .from("user_badges")
        .select("*", { count: "exact", head: true })
        .in("user_id", userIds)
        .gte("created_at", sevenDaysAgo);
      
      badgeCount = badgeCountResult || 0;
    }

    return {
      totalCourses: coursesCount || 0,
      totalLearners: learnersCount || 0,
      totalInstructors: instructorsCount || 0,
      totalPaths: pathsCount || 0,
      last24hLogins: loginCount,
      last7dBadges: badgeCount,
    };
  } catch (error) {
    console.warn("[admin|getKpis] Supabase error, using mocks", error);
    return emptyKpis;
  }
};

export const getRecentActivity = async (): Promise<ActivityFeedItem[]> => {
  const orgId = await getAdminOrgId();
  
  if (!orgId) {
    console.warn("[admin|getRecentActivity] No organization found for admin");
    return [];
  }

  // In the future, this could query activity specific to the organization
  return [];
};

// ============================================================================
// QUALIOPI OVERVIEW
// ============================================================================

export const getQualiopiOverview = async (): Promise<QualiopiOverview> => {
  const orgId = await getAdminOrgId();

  if (!orgId) {
    console.warn("[admin|getQualiopiOverview] No organization found for admin");
    return emptyQualiopiOverview;
  }

  const supabase = getServiceRoleClient();
  if (!supabase) return emptyQualiopiOverview;

  try {
    const toNumber = (value: unknown): number => {
      if (typeof value === "number") return value;
      if (typeof value === "bigint") return Number(value);
      if (typeof value === "string") {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
      }
      return 0;
    };

    const { data: groupsData, error: groupsError } = await supabase
      .from("groups")
      .select("id, name")
      .eq("org_id", orgId);

    if (groupsError) {
      throw groupsError;
    }

    const { data: membershipRows, error: membershipsError } = await supabase
      .from("org_memberships")
      .select("user_id")
      .eq("org_id", orgId)
      .eq("role", "student");

    if (membershipsError) {
      throw membershipsError;
    }

    if (!membershipRows || membershipRows.length === 0) {
      return emptyQualiopiOverview;
    }

    const learnerIds = membershipRows
      .map((row) => row.user_id)
      .filter((value): value is string => Boolean(value));

    if (learnerIds.length === 0) {
      return emptyQualiopiOverview;
    }

    const groupIds = (groupsData || []).map((group) => group.id);
    const groupMap = new Map((groupsData || []).map((group) => [group.id, group]));

    const [
      { data: profiles, error: profilesError },
      groupMembersResult,
      { data: sessionRows, error: sessionsError },
      { data: progressRows, error: progressError },
      { data: enrollmentRows, error: enrollmentsError },
      { data: testRows, error: testsError },
      { data: badgeRows, error: badgesError },
    ] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email").in("id", learnerIds),
      groupIds.length > 0
        ? supabase
            .from("group_members")
            .select("user_id, group_id")
            .in("user_id", learnerIds)
            .in("group_id", groupIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("learning_sessions")
        .select("user_id, duration_seconds, duration_active_seconds, started_at, ended_at")
        .in("user_id", learnerIds),
      supabase
        .from("course_progress")
        .select("user_id, progress_percent")
        .in("user_id", learnerIds),
      supabase
        .from("enrollments")
        .select("user_id, course_id, created_at")
        .in("user_id", learnerIds),
      supabase
        .from("test_attempts")
        .select("user_id, score")
        .in("user_id", learnerIds),
      supabase
        .from("user_badges")
        .select("user_id")
        .in("user_id", learnerIds),
    ]);

    if (profilesError) throw profilesError;
    if (sessionsError) throw sessionsError;
    if (progressError) throw progressError;
    if (enrollmentsError) throw enrollmentsError;
    if (testsError) throw testsError;
    if (badgesError) throw badgesError;

    const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    (profiles || []).forEach((profile) => {
      if (profile?.id) {
        profileMap.set(profile.id, { full_name: profile.full_name ?? null, email: profile.email ?? null });
      }
    });

    const groupsByUserId = new Map<string, Array<{ id: string; name: string }>>();
    (groupMembersResult.data || []).forEach((membership: { user_id?: string; group_id?: string }) => {
      if (membership?.user_id && membership?.group_id) {
        const group = groupMap.get(membership.group_id);
        if (group) {
          if (!groupsByUserId.has(membership.user_id)) {
            groupsByUserId.set(membership.user_id, []);
          }
          groupsByUserId.get(membership.user_id)!.push({ id: group.id, name: group.name });
        }
      }
    });

    type SessionStats = { total: number; active: number; lastActivity: string | null };
    const sessionStats = new Map<string, SessionStats>();
    (sessionRows || []).forEach((row) => {
      if (!row?.user_id) return;
      const total = toNumber(row.duration_seconds);
      const active = toNumber(row.duration_active_seconds);
      const current = sessionStats.get(row.user_id) ?? { total: 0, active: 0, lastActivity: null };
      const candidate = (row.ended_at as string | null) ?? (row.started_at as string | null) ?? null;
      current.total += total;
      current.active += active;
      if (candidate) {
        if (!current.lastActivity || new Date(candidate).getTime() > new Date(current.lastActivity).getTime()) {
          current.lastActivity = candidate;
        }
      }
      sessionStats.set(row.user_id, current);
    });

    type CompletionStats = { total: number; count: number };
    const completionStats = new Map<string, CompletionStats>();
    (progressRows || []).forEach((row) => {
      if (!row?.user_id) return;
      const percent = toNumber(row.progress_percent);
      const current = completionStats.get(row.user_id) ?? { total: 0, count: 0 };
      current.total += percent;
      current.count += 1;
      completionStats.set(row.user_id, current);
    });

    const courseSets = new Map<string, Set<string>>();
    const enrollmentLastMap = new Map<string, string>();
    (enrollmentRows || []).forEach((row) => {
      if (!row?.user_id || !row?.course_id) return;
      if (!courseSets.has(row.user_id)) {
        courseSets.set(row.user_id, new Set());
      }
      courseSets.get(row.user_id)!.add(String(row.course_id));
      if (row.created_at) {
        const current = enrollmentLastMap.get(row.user_id);
        if (!current || new Date(row.created_at).getTime() > new Date(current).getTime()) {
          enrollmentLastMap.set(row.user_id, row.created_at as string);
        }
      }
    });

    type TestStats = { totalScore: number; count: number };
    const testStats = new Map<string, TestStats>();
    (testRows || []).forEach((row) => {
      if (!row?.user_id) return;
      const numericScore = row?.score !== null && row?.score !== undefined ? Number(row.score) : NaN;
      if (!Number.isFinite(numericScore)) return;
      const current = testStats.get(row.user_id) ?? { totalScore: 0, count: 0 };
      current.totalScore += numericScore;
      current.count += 1;
      testStats.set(row.user_id, current);
    });

    const badgeCounts = new Map<string, number>();
    (badgeRows || []).forEach((row) => {
      if (!row?.user_id) return;
      const current = badgeCounts.get(row.user_id) ?? 0;
      badgeCounts.set(row.user_id, current + 1);
    });

    const learnerSummaries: QualiopiLearnerSummary[] = learnerIds.map((userId) => {
      const profile = profileMap.get(userId);
      const session = sessionStats.get(userId) ?? { total: 0, active: 0, lastActivity: null };
      const completion = completionStats.get(userId) ?? { total: 0, count: 0 };
      const completionSamples = completion.count;
      const coursesFollowed = courseSets.get(userId)?.size ?? 0;
      const tests = testStats.get(userId) ?? { totalScore: 0, count: 0 };
      const badges = badgeCounts.get(userId) ?? 0;
      const groups = groupsByUserId.get(userId) || [];

      const averageCompletion = completionSamples > 0 ? completion.total / completionSamples : 0;
      const testsTaken = tests.count;
      const testsAverageScore = testsTaken > 0 ? tests.totalScore / testsTaken : null;

      let lastActivity = session.lastActivity;
      const enrollmentFallback = enrollmentLastMap.get(userId);
      if (
        (!lastActivity && enrollmentFallback) ||
        (lastActivity && enrollmentFallback && new Date(enrollmentFallback).getTime() > new Date(lastActivity).getTime())
      ) {
        lastActivity = enrollmentFallback;
      }

      return {
        id: userId,
        fullName: profile?.full_name ?? null,
        email: profile?.email ?? null,
        groups,
        totalDurationSeconds: session.total,
        activeDurationSeconds: session.active,
        coursesFollowed,
        averageCompletion,
        completionSampleCount: completionSamples,
        testsTaken,
        testsAverageScore,
        badgesCount: badges,
        lastActivityAt: lastActivity ?? null,
      };
    });

    const sanitizedLearners: QualiopiLearnerPublicSummary[] = learnerSummaries.map(
      ({ completionSampleCount, ...rest }) => rest,
    );

    const groupSummaries: QualiopiGroupSummary[] = (groupsData || []).map((group) => {
      const groupLearners = learnerSummaries.filter((learner) =>
        learner.groups.some((membership) => membership.id === group.id),
      );

      const memberCount = groupLearners.length;
      const totalDurationSeconds = groupLearners.reduce((sum, learner) => sum + learner.totalDurationSeconds, 0);
      const activeDurationSeconds = groupLearners.reduce((sum, learner) => sum + learner.activeDurationSeconds, 0);
      const coursesFollowed = groupLearners.reduce((sum, learner) => sum + learner.coursesFollowed, 0);
      const completionNumerator = groupLearners.reduce(
        (sum, learner) => sum + learner.averageCompletion * learner.completionSampleCount,
        0,
      );
      const completionDenominator = groupLearners.reduce(
        (sum, learner) => sum + learner.completionSampleCount,
        0,
      );
      const averageCompletion =
        completionDenominator > 0 ? completionNumerator / completionDenominator : 0;

      const testsTaken = groupLearners.reduce((sum, learner) => sum + learner.testsTaken, 0);
      const testsNumerator = groupLearners.reduce((sum, learner) => {
        if (learner.testsTaken > 0 && learner.testsAverageScore !== null) {
          return sum + learner.testsAverageScore * learner.testsTaken;
        }
        return sum;
      }, 0);
      const testsDenominator = groupLearners.reduce((sum, learner) => sum + learner.testsTaken, 0);
      const averageScore = testsDenominator > 0 ? testsNumerator / testsDenominator : null;
      const badgesCount = groupLearners.reduce((sum, learner) => sum + learner.badgesCount, 0);

      return {
        id: group.id,
        name: group.name,
        memberCount,
        totalDurationSeconds,
        activeDurationSeconds,
        coursesFollowed,
        averageCompletion,
        averageScore,
        testsTaken,
        badgesCount,
        learners: groupLearners.map(({ completionSampleCount, ...rest }) => rest),
      };
    });

    return {
      groups: groupSummaries,
      learners: sanitizedLearners,
    };
  } catch (error) {
    console.error("[admin|getQualiopiOverview] error:", error);
    return emptyQualiopiOverview;
  }
};

// ============================================================================
// LEARNERS
// ============================================================================

export const getAdminLearners = async (): Promise<AdminLearner[]> => {
  const orgId = await getAdminOrgId();
  
  if (!orgId) {
    console.warn("[admin|getAdminLearners] No organization found for admin");
    return [];
  }

  let supabase;
  try {
    supabase = getServiceRoleClient();
  } catch (error) {
    console.warn("[admin|getAdminLearners] Service client unavailable", error);
    return [];
  }

  if (!supabase) {
    return [];
  }

  try {
    // Get learners (students) in the organization
    const { data: memberships, error: membershipsError } = await supabase
      .from("org_memberships")
      .select("user_id, role")
      .eq("org_id", orgId)
      .eq("role", "student");

    if (membershipsError) {
      console.error("[admin|getAdminLearners] Error fetching memberships:", membershipsError);
      return [];
    }

    if (!memberships || memberships.length === 0) {
      return [];
    }

    const userIds = memberships.map(m => m.user_id);
    
    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds);

    if (profilesError) {
      console.error("[admin|getAdminLearners] Error fetching profiles:", profilesError);
      return [];
    }

    // Get groups for each learner
    const { data: groupMembers } = await supabase
      .from("group_members")
      .select("user_id, group_id, groups(id, name)")
      .in("user_id", userIds);

    const groupsByUserId = new Map<string, Array<{ id: string; name: string }>>();
    if (groupMembers) {
      groupMembers.forEach((gm) => {
        if (gm.groups && typeof gm.groups === 'object' && 'id' in gm.groups && 'name' in gm.groups) {
          const group = gm.groups as { id: string; name: string };
          if (!groupsByUserId.has(gm.user_id)) {
            groupsByUserId.set(gm.user_id, []);
          }
          groupsByUserId.get(gm.user_id)!.push({ id: group.id, name: group.name });
        }
      });
    }

    return (profiles || []).map((profile) => ({
      id: profile.id,
      fullName: profile.full_name,
      email: profile.email,
      status: "actif" as const,
      groups: groupsByUserId.get(profile.id) || [],
    }));
  } catch (error) {
    console.warn("[admin|getAdminLearners] Supabase error", error);
    return [];
  }
};

// ============================================================================
// GROUPS
// ============================================================================

export const getAdminGroups = async (): Promise<AdminGroup[]> => {
  const orgId = await getAdminOrgId();
  
  if (!orgId) {
    console.warn("[admin|getAdminGroups] No organization found for admin");
    return [];
  }

  let supabase;
  try {
    supabase = getServiceRoleClient();
  } catch (error) {
    console.warn("[admin|getAdminGroups] Service client unavailable", error);
    return [];
  }

  if (!supabase) {
    return [];
  }

  try {
    const { data: groups, error } = await supabase
      .from("groups")
      .select(`
        id,
        name,
        org_id,
        organization:organizations!groups_org_id_fkey(name)
      `)
      .eq("org_id", orgId);

    if (error) {
      console.error("[admin|getAdminGroups] Error:", error);
      return [];
    }

    if (!groups || groups.length === 0) {
      return [];
    }

    // Get member counts for each group
    const groupIds = groups.map(g => g.id);
    const { data: groupMembers } = await supabase
      .from("group_members")
      .select("group_id")
      .in("group_id", groupIds);

    const memberCounts = new Map<string, number>();
    if (groupMembers) {
      groupMembers.forEach((gm) => {
        memberCounts.set(gm.group_id, (memberCounts.get(gm.group_id) || 0) + 1);
      });
    }

    return groups.map((group) => ({
      id: group.id,
      name: group.name || "Groupe sans nom",
      memberCount: memberCounts.get(group.id) || 0,
      orgName: (group.organization as { name?: string })?.name ?? null,
    }));
  } catch (error) {
    console.warn("[admin|getAdminGroups] Supabase error, returning fallback", error);
    return [];
  }
};

// ============================================================================
// ASSIGNABLE CATALOG
// ============================================================================

export const getAdminAssignableCatalog = async (): Promise<AdminAssignableCatalog> => {
  // Récupérer l'org_id de l'admin
  const orgId = await getAdminOrgId();
  
  if (!orgId) {
    console.warn("[admin|getAdminAssignableCatalog] No organization found for admin");
    return fallbackAssignableCatalog;
  }

  let supabase;
  try {
    supabase = getServiceRoleClient();
  } catch (error) {
    console.warn("[admin|getAdminAssignableCatalog] Service client unavailable", error);
    return fallbackAssignableCatalog;
  }

  if (!supabase) {
    console.warn("[admin|getAdminAssignableCatalog] Service client is null");
    return fallbackAssignableCatalog;
  }

  try {
    // Filtrer tous les contenus par org_id de l'admin
    const [organizationsRes, groupsRes, coursesRes, pathsRes, resourcesRes, testsRes] = await Promise.all([
      supabase.from("organizations").select("id, name").eq("id", orgId).order("name"),
      supabase.from("groups").select("id, name").eq("org_id", orgId).order("name"),
      supabase
        .from("courses")
        .select("id, title, status, slug, creator_id, owner_id, cover_image, cover_url, hero_image_url, thumbnail_url")
        .eq("org_id", orgId)
        .order("title")
        .limit(200),
      supabase
        .from("paths")
        .select("id, title, status, slug, creator_id, owner_id, thumbnail_url, hero_url")
        .eq("org_id", orgId)
        .order("title")
        .limit(200),
      supabase
        .from("resources")
        .select("id, title, type, status, slug, created_by, owner_id, cover_url, thumbnail_url")
        .eq("org_id", orgId)
        .order("title")
        .limit(200),
      supabase
        .from("tests")
        .select("id, title, status, slug, created_by, owner_id, cover_image, thumbnail_url")
        .eq("org_id", orgId)
        .order("title")
        .limit(200),
    ]);

    const organizations = organizationsRes.error
      ? fallbackAssignableCatalog.organizations
      : (organizationsRes.data ?? []).map((org) => ({ id: org.id, name: org.name ?? "Organisation" }));

    const groups = groupsRes.error
      ? fallbackAssignableCatalog.groups
      : (groupsRes.data ?? []).map((group) => ({ id: group.id, name: group.name ?? "Groupe" }));

    const courses = coursesRes.error
      ? fallbackAssignableCatalog.courses
      : (coursesRes.data ?? []).map((course) => ({
          id: course.id,
          title: course.title ?? "Formation",
          status: course.status ?? null,
          slug: course.slug ?? null,
          creator_id: course.creator_id ?? null,
          owner_id: course.owner_id ?? null,
          cover_image: course.cover_image ?? course.cover_url ?? course.hero_image_url ?? course.thumbnail_url ?? null,
          cover_url: course.cover_url ?? null,
          hero_image_url: course.hero_image_url ?? null,
          thumbnail_url: course.thumbnail_url ?? null,
        }));

    const paths = pathsRes.error
      ? fallbackAssignableCatalog.paths
      : (pathsRes.data ?? []).map((path) => ({
          id: path.id,
          title: path.title ?? "Parcours",
          status: path.status ?? null,
          slug: path.slug ?? null,
          creator_id: path.creator_id ?? null,
          owner_id: path.owner_id ?? null,
          thumbnail_url: path.thumbnail_url ?? path.hero_url ?? null,
          hero_url: path.hero_url ?? null,
        }));

    const resources = resourcesRes.error
      ? fallbackAssignableCatalog.resources
      : (resourcesRes.data ?? []).map((resource) => ({
          id: resource.id,
          title: resource.title ?? "Ressource",
          type: resource.type ?? null,
          status: resource.status ?? null,
          slug: resource.slug ?? null,
          created_by: resource.created_by ?? null,
          owner_id: resource.owner_id ?? null,
          cover_url: resource.cover_url ?? resource.thumbnail_url ?? null,
          thumbnail_url: resource.thumbnail_url ?? null,
        }));

    const tests = testsRes.error
      ? fallbackAssignableCatalog.tests
      : (testsRes.data ?? []).map((test) => ({
          id: test.id,
          title: test.title ?? "Test",
          status: test.status ?? null,
          slug: test.slug ?? null,
          created_by: test.created_by ?? null,
          owner_id: test.owner_id ?? null,
          cover_image: test.cover_image ?? test.thumbnail_url ?? null,
          thumbnail_url: test.thumbnail_url ?? null,
        }));

    return {
      organizations: organizations.length ? organizations : fallbackAssignableCatalog.organizations,
      groups: groups.length ? groups : fallbackAssignableCatalog.groups,
      courses: courses.length ? courses : fallbackAssignableCatalog.courses,
      paths: paths.length ? paths : fallbackAssignableCatalog.paths,
      resources: resources.length ? resources : fallbackAssignableCatalog.resources,
      tests: tests.length ? tests : fallbackAssignableCatalog.tests,
    };
  } catch (error) {
    console.warn("[admin|getAdminAssignableCatalog] Supabase error, returning fallback", error);
    return fallbackAssignableCatalog;
  }
};
