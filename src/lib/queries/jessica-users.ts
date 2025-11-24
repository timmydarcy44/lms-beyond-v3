"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export type JessicaUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  totalRevenue: number;
  purchaseCount: number;
  testCount: number;
};

export type JessicaUserDetails = {
  id: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  createdAt: string;
  purchases: Array<{
    id: string;
    catalogItemId: string;
    title: string;
    itemType: string;
    price: number;
    purchasedAt: string;
    status: string;
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

/**
 * Récupère la liste de tous les utilisateurs avec leurs statistiques
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

    // Récupérer TOUS les profils (pas seulement ceux qui ont des achats)
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email, full_name, phone, created_at")
      .order("created_at", { ascending: false });

    if (!profiles || profiles.length === 0) {
      return [];
    }

    const userIds = profiles.map((p) => p.id);

    // Récupérer les achats liés aux contenus de Jessica (inclure purchased et manually_granted)
    const { data: accessData } = await supabase
      .from("catalog_item_access")
      .select(`
        user_id,
        granted_at,
        access_type,
        catalog_items!inner (
          id,
          creator_id,
          price
        )
      `)
      .eq("catalog_items.creator_id", jessicaProfile.id)
      .in("access_type", ["purchased", "manually_granted"])
      .in("user_id", userIds);

    // Calculer les statistiques pour chaque utilisateur
    const usersWithStats = (profiles || []).map((profile) => {
      const userAccess = (accessData || []).filter((a: any) => a.user_id === profile.id);
      // Calculer le CA uniquement pour les achats (pas les assignations manuelles)
      const purchasedAccess = userAccess.filter((a: any) => a.access_type === "purchased");
      const totalRevenue = purchasedAccess.reduce((sum: number, a: any) => {
        return sum + (a.catalog_items?.price || 0);
      }, 0);

      return {
        id: profile.id,
        email: profile.email || "",
        fullName: profile.full_name || null,
        phone: profile.phone || null,
        createdAt: profile.created_at || new Date().toISOString(),
        totalRevenue,
        purchaseCount: userAccess.length,
        testCount: 0, // Sera calculé séparément
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

    // Récupérer les achats (inclure purchased et manually_granted)
    const { data: accessData } = await supabase
      .from("catalog_item_access")
      .select(`
        id,
        catalog_item_id,
        granted_at,
        access_type,
        catalog_items!inner (
          id,
          title,
          item_type,
          price,
          creator_id
        )
      `)
      .eq("user_id", userId)
      .eq("catalog_items.creator_id", jessicaProfile.id)
      .in("access_type", ["purchased", "manually_granted"])
      .order("granted_at", { ascending: false });

    const purchases = (accessData || []).map((a: any) => ({
      id: a.id,
      catalogItemId: a.catalog_item_id,
      title: a.catalog_items?.title || "Titre inconnu",
      itemType: a.catalog_items?.item_type || "unknown",
      price: a.catalog_items?.price || 0,
      purchasedAt: a.granted_at || new Date().toISOString(),
      status: a.access_type === "manually_granted" ? "manually_granted" : "completed",
    }));

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

    return {
      id: profile.id,
      email: profile.email || "",
      fullName: profile.full_name || null,
      phone: profile.phone || null,
      createdAt: profile.created_at || new Date().toISOString(),
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

