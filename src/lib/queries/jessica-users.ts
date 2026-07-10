"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { parseClientName } from "@/lib/jessica-contentin/parse-client-name";
import {
  catalogItemsTableExists,
  fetchJessicaCourseEnrollmentsForUsers,
  getJessicaStudioCourseIds,
  isJessicaAssignableCatalogItem,
} from "@/lib/jessica-contentin/sync-jessica-catalog";
import {
  fetchLastSignInForUser,
  fetchLastSignInForUserIds,
} from "@/lib/queries/learner-tracking";
import { resolveJessicaPurchaseAmount } from "@/lib/jessica-contentin/purchase-revenue";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";
const JESSICA_SIGNUP_SOURCE = "jessica_contentin";

export type JessicaUserListItem = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  totalRevenue: number;
  purchaseCount: number;
  testCount: number;
  assignedCatalogItemIds: string[];
};

export type JessicaUserDetails = {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  lastSignInAt: string | null;
  purchases: Array<{
    id: string;
    catalogItemId: string;
    title: string;
    itemType: string;
    price: number;
    purchasedAt: string;
    status: string;
    accessStatus: string; // "purchased" | "manually_granted" | "free"
  }>;
  testResults: Array<{
    id: string;
    testId: string;
    testTitle: string;
    completedAt: string;
    score?: number;
    percentage?: number;
  }>;
  totalRevenue: number;
  purchaseCount: number;
  testCount: number;
};

async function getJessicaClientIdSet(
  supabase: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  jessicaProfileId: string,
): Promise<Set<string>> {
  const ids = new Set<string>();

  const studioCourseIds = await getJessicaStudioCourseIds(supabase);

  if (await catalogItemsTableExists(supabase)) {
    const { data: accessRows } = await supabase
      .from("catalog_access")
      .select(`user_id, catalog_items!inner(id, creator_id, created_by, item_type, content_id)`)
      .in("access_status", ["purchased", "manually_granted", "free"])
      .not("user_id", "is", null);

    const jessicaAccessRows = (accessRows ?? []).filter((row) => {
      const item = (row as { catalog_items?: Record<string, unknown> }).catalog_items;
      if (!item) return false;
      return isJessicaAssignableCatalogItem(
        item as Parameters<typeof isJessicaAssignableCatalogItem>[0],
        jessicaProfileId,
        studioCourseIds,
      );
    });

    for (const row of jessicaAccessRows) {
      const uid = (row as { user_id?: string }).user_id;
      if (uid) ids.add(uid);
    }
  }

  if (studioCourseIds.size > 0) {
    const { data: enrollmentRows } = await supabase
      .from("course_enrollments")
      .select("user_id")
      .in("course_id", Array.from(studioCourseIds));
    for (const row of enrollmentRows ?? []) {
      if (row.user_id) ids.add(String(row.user_id));
    }
  }

  let page = 1;
  const perPage = 200;
  while (page <= 10) {
    const { data: authPage, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error || !authPage?.users?.length) break;
    for (const user of authPage.users) {
      const source = String(user.user_metadata?.signup_source ?? "");
      if (source === JESSICA_SIGNUP_SOURCE) ids.add(user.id);
    }
    if (authPage.users.length < perPage) break;
    page += 1;
  }

  ids.delete(jessicaProfileId);
  return ids;
}

/**
 * Récupère la liste des clients Jessica avec leurs statistiques
 */
export async function getJessicaUsersList(): Promise<JessicaUserListItem[]> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    console.error("[jessica-users] Access denied");
    return [];
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    console.error("[jessica-users] Service role client not available");
    return [];
  }

  try {
    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      console.error("[jessica-users] Jessica Contentin profile not found");
      return [];
    }

    const clientIds = await getJessicaClientIdSet(supabase, jessicaProfile.id);
    if (clientIds.size === 0) return [];

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at")
      .in("id", Array.from(clientIds))
      .order("created_at", { ascending: false });

    if (!profiles || profiles.length === 0) {
      return [];
    }

    const userIds = profiles.map((p) => p.id);

    const studioCourseIds = await getJessicaStudioCourseIds(supabase);
    const hasCatalog = await catalogItemsTableExists(supabase);

    const lastSignInMap = await fetchLastSignInForUserIds(supabase, userIds);

    let accessData: Array<Record<string, unknown>> = [];
    if (hasCatalog) {
      const { data: accessDataRaw } = await supabase
        .from("catalog_access")
        .select(`
          user_id,
          catalog_item_id,
          granted_at,
          access_status,
          purchase_amount,
          catalog_items!inner (id, creator_id, created_by, item_type, content_id, price)
        `)
        .in("access_status", ["purchased", "manually_granted"])
        .in("user_id", userIds)
        .not("user_id", "is", null);

      accessData = (accessDataRaw ?? []).filter((row: { catalog_items?: Record<string, unknown> }) => {
        const item = row.catalog_items;
        if (!item) return false;
        return isJessicaAssignableCatalogItem(
          item as Parameters<typeof isJessicaAssignableCatalogItem>[0],
          jessicaProfile.id,
          studioCourseIds,
        );
      });
    }

    const courseEnrollments = await fetchJessicaCourseEnrollmentsForUsers(supabase, userIds);

    // Calculer les statistiques pour chaque utilisateur
    const usersWithStats = (profiles || []).map((profile) => {
      const userAccess = (accessData || []).filter((a: { user_id?: string }) => a.user_id === profile.id);
      const userEnrollments = courseEnrollments.filter((e) => e.user_id === profile.id);
      const enrolledCourseIds = new Set(userEnrollments.map((e) => e.course_id));
      const catalogContentIdsFromAccess = new Set(
        userAccess
          .map((a: { catalog_items?: { content_id?: string } }) => a.catalog_items?.content_id)
          .filter(Boolean) as string[],
      );

      const revenueFromAccess = userAccess.reduce((sum: number, a: Record<string, unknown>) => {
        const item = a.catalog_items as { price?: number } | undefined;
        return (
          sum +
          resolveJessicaPurchaseAmount({
            accessStatus: a.access_status as string | undefined,
            purchaseAmount: a.purchase_amount as number | undefined,
            catalogPrice: item?.price,
          })
        );
      }, 0);

      const revenueFromEnrollments = userEnrollments
        .filter((e) => !catalogContentIdsFromAccess.has(e.course_id))
        .reduce(
          (sum, e) =>
            sum +
            resolveJessicaPurchaseAmount({
              purchaseAmount: (e as { purchase_amount?: number | null }).purchase_amount,
            }),
          0,
        );

      const totalRevenue = revenueFromAccess + revenueFromEnrollments;
      const { firstName, lastName } = parseClientName(profile.full_name);

      const assignedFromCatalog = userAccess
        .map((a: { catalog_item_id?: string }) => a.catalog_item_id)
        .filter(Boolean) as string[];

      return {
        id: profile.id,
        email: profile.email || "",
        firstName,
        lastName,
        fullName: profile.full_name || null,
        phone: profile.phone || null,
        createdAt: profile.created_at || new Date().toISOString(),
        lastSignInAt: lastSignInMap.get(profile.id) ?? null,
        totalRevenue,
        purchaseCount: userAccess.length + userEnrollments.length,
        testCount: 0,
        assignedCatalogItemIds: [...assignedFromCatalog, ...Array.from(enrolledCourseIds)],
      };
    });

    // Récupérer les résultats de tests
    const { data: testAttempts } = await supabase
      .from("test_attempts")
      .select("user_id, test_id")
      .in("user_id", userIds);

    const { data: mentalHealthAssessments } = await supabase
      .from("mental_health_assessments")
      .select("user_id, id")
      .in("user_id", userIds);

    // Compter les tests par utilisateur
    const testCountMap = new Map<string, number>();
    (testAttempts || []).forEach((attempt: any) => {
      testCountMap.set(attempt.user_id, (testCountMap.get(attempt.user_id) || 0) + 1);
    });
    (mentalHealthAssessments || []).forEach((assessment: any) => {
      testCountMap.set(assessment.user_id, (testCountMap.get(assessment.user_id) || 0) + 1);
    });

    // Ajouter les comptes de tests
    return usersWithStats.map((user) => ({
      ...user,
      testCount: testCountMap.get(user.id) || 0,
    }));
  } catch (error) {
    console.error("[jessica-users] Error fetching users list:", error);
    return [];
  }
}

/**
 * Récupère les détails complets d'un utilisateur
 */
export async function getJessicaUserDetails(userId: string): Promise<JessicaUserDetails | null> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    console.error("[jessica-users] Access denied");
    return null;
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    console.error("[jessica-users] Service role client not available");
    return null;
  }

  try {
    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      console.error("[jessica-users] Jessica Contentin profile not found");
      return null;
    }

    // Récupérer le profil de l'utilisateur
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return null;
    }

    const studioCourseIds = await getJessicaStudioCourseIds(supabase);
    const hasCatalog = await catalogItemsTableExists(supabase);

    let accessData: Array<Record<string, unknown>> = [];
    if (hasCatalog) {
      const { data: accessDataRaw } = await supabase
        .from("catalog_access")
        .select(`
          id,
          catalog_item_id,
          granted_at,
          access_status,
          purchase_amount,
          catalog_items!inner (
            id, title, item_type, price, creator_id, created_by, content_id
          )
        `)
        .eq("user_id", userId)
        .in("access_status", ["purchased", "manually_granted"])
        .is("organization_id", null)
        .order("granted_at", { ascending: false });

      accessData = (accessDataRaw ?? []).filter((row: { catalog_items?: Record<string, unknown> }) => {
        const item = row.catalog_items;
        if (!item) return false;
        return isJessicaAssignableCatalogItem(
          item as Parameters<typeof isJessicaAssignableCatalogItem>[0],
          jessicaProfile.id,
          studioCourseIds,
        );
      });
    }

    const purchasesFromCatalog = (accessData || []).map((a: Record<string, unknown>) => {
      const item = a.catalog_items as { title?: string; item_type?: string; price?: number } | undefined;
      return {
        id: a.id as string,
        catalogItemId: a.catalog_item_id as string,
        title: item?.title || "Titre inconnu",
        itemType: item?.item_type || "unknown",
        price: resolveJessicaPurchaseAmount({
          accessStatus: a.access_status as string | undefined,
          purchaseAmount: a.purchase_amount as number | undefined,
          catalogPrice: item?.price,
        }),
        purchasedAt: (a.granted_at as string) || new Date().toISOString(),
        status: a.access_status === "manually_granted" ? "manually_granted" : "completed",
        accessStatus: (a.access_status as string) || "purchased",
      };
    });

    const enrollments = await fetchJessicaCourseEnrollmentsForUsers(supabase, [userId]);
    const catalogContentIds = new Set(
      purchasesFromCatalog.map((p) => {
        const row = accessData?.find((a: any) => a.id === p.id);
        return row?.catalog_items?.content_id as string | undefined;
      }).filter(Boolean),
    );

    const purchasesFromEnrollments = enrollments
      .filter((e) => !catalogContentIds.has(e.course_id))
      .map((e) => ({
        id: `enrollment-${e.id}`,
        catalogItemId: e.course_id,
        title: e.courses?.title || "Formation",
        itemType: "module",
        price: resolveJessicaPurchaseAmount({
          purchaseAmount: (e as { purchase_amount?: number | null }).purchase_amount,
        }),
        purchasedAt: e.created_at || new Date().toISOString(),
        status: "manually_granted",
        accessStatus: "manually_granted",
      }));

    const purchases = [...purchasesFromCatalog, ...purchasesFromEnrollments];

    // Récupérer les résultats de tests
    const { data: testAttempts } = await supabase
      .from("test_attempts")
      .select(`
        id,
        test_id,
        completed_at,
        score,
        max_score,
        tests (
          id,
          title
        )
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    const { data: mentalHealthAssessments } = await supabase
      .from("mental_health_assessments")
      .select(`
        id,
        completed_at,
        results
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false });

    const testResults: JessicaUserDetails["testResults"] = [];

    // Ajouter les résultats de test_attempts
    (testAttempts || []).forEach((attempt: any) => {
      testResults.push({
        id: attempt.id,
        testId: attempt.test_id,
        testTitle: attempt.tests?.title || "Test inconnu",
        completedAt: attempt.completed_at || new Date().toISOString(),
        score: attempt.score,
        percentage: attempt.max_score > 0 ? (attempt.score / attempt.max_score) * 100 : undefined,
      });
    });

    // Ajouter les résultats de mental_health_assessments
    (mentalHealthAssessments || []).forEach((assessment: any) => {
      const results = assessment.results || {};
      const categories = Object.keys(results);
      const totalPercentage = categories.length > 0
        ? categories.reduce((sum: number, cat: string) => {
            const catResult = results[cat];
            return sum + (catResult?.percentage || 0);
          }, 0) / categories.length
        : 0;

      testResults.push({
        id: assessment.id,
        testId: "soft-skills",
        testTitle: "Soft Skills – Profil 360",
        completedAt: assessment.completed_at || new Date().toISOString(),
        percentage: totalPercentage,
      });
    });

    // Calculer les statistiques
    const totalRevenue = purchases.reduce((sum, p) => sum + p.price, 0);
    const purchaseCount = purchases.length;
    const testCount = testResults.length;
    const { firstName, lastName } = parseClientName(profile.full_name);
    const lastSignInAt = await fetchLastSignInForUser(supabase, userId);

    return {
      id: profile.id,
      email: profile.email || "",
      firstName,
      lastName,
      fullName: profile.full_name || null,
      phone: profile.phone || null,
      createdAt: profile.created_at || new Date().toISOString(),
      lastSignInAt,
      purchases,
      testResults,
      totalRevenue,
      purchaseCount,
      testCount,
    };
  } catch (error) {
    console.error("[jessica-users] Error fetching user details:", error);
    return null;
  }
}

