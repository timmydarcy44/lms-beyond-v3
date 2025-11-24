"use server";

import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export type JessicaDashboardStats = {
  // Trafic
  totalVisits: number;
  uniqueVisitors: number;
  visitsLast7d: number;
  visitsLast30d: number;
  
  // Paniers
  activeCarts: number;
  abandonedCarts: number; // Paniers non modifiés depuis 24h
  cartsInProgress: number; // Paniers modifiés dans les dernières 24h
  
  // CA
  totalRevenue: number;
  revenueLast7d: number;
  revenueLast30d: number;
  revenueLastMonth: number;
  
  // Commandes
  totalOrders: number;
  ordersLast7d: number;
  ordersLast30d: number;
  averageOrderValue: number;
  
  // Utilisateurs
  totalUsers: number;
  newUsersLast7d: number;
  newUsersLast30d: number;
};

export async function getJessicaDashboardStats(): Promise<JessicaDashboardStats> {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    throw new Error("Accès refusé");
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    throw new Error("Service indisponible");
  }

  try {
    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      throw new Error("Profil Jessica Contentin non trouvé");
    }

    const now = new Date();
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Trafic - Utiliser login_events comme proxy (à améliorer avec un vrai système de tracking)
    const { data: loginEvents } = await supabase
      .from("login_events")
      .select("user_id, at")
      .gte("at", last30d.toISOString());

    const uniqueVisitors = new Set((loginEvents || []).map((e) => e.user_id)).size;
    const visitsLast7d = (loginEvents || []).filter((e) => new Date(e.at) >= last7d).length;
    const visitsLast30d = loginEvents?.length || 0;

    // Paniers - Filtrer uniquement les paniers liés aux contenus de Jessica
    // Note: cart_items n'a pas de lien direct avec creator_id, donc on récupère tous les paniers
    // et on filtre par les catalog_items de Jessica si possible
    const { data: allCarts } = await supabase
      .from("cart_items")
      .select("user_id, added_at, updated_at, content_id, content_type")
      .order("added_at", { ascending: false });

    // Pour une meilleure précision, on pourrait filtrer par les catalog_items de Jessica
    // mais pour l'instant, on prend tous les paniers (approximation)
    const activeCarts = new Set((allCarts || []).map((c) => c.user_id)).size;
    const abandonedCarts = (allCarts || []).filter((c) => {
      const lastUpdate = c.updated_at || c.added_at;
      return new Date(lastUpdate) < last24h;
    }).length;
    const cartsInProgress = (allCarts || []).filter((c) => {
      const lastUpdate = c.updated_at || c.added_at;
      return new Date(lastUpdate) >= last24h;
    }).length;

    // CA et Commandes - Utiliser catalog_access pour les achats
    // Inclure à la fois "purchased" (achats en ligne) et "manually_granted" (assignations manuelles)
    const { data: purchases } = await supabase
      .from("catalog_access")
      .select(`
        granted_at,
        access_status,
        catalog_items!inner (
          price,
          creator_id
        )
      `)
      .eq("catalog_items.creator_id", jessicaProfile.id)
      .in("access_status", ["purchased", "manually_granted"])
      .not("user_id", "is", null); // Seulement les accès B2C (avec user_id)

    // Calculer le CA uniquement pour les achats (pas les assignations manuelles)
    const purchasedItems = (purchases || []).filter((p: any) => p.access_status === "purchased");
    
    const totalRevenue = purchasedItems.reduce((sum: number, p: any) => {
      return sum + (p.catalog_items?.price || 0);
    }, 0);

    const revenueLast7d = purchasedItems.filter((p: any) => {
      return new Date(p.granted_at) >= last7d;
    }).reduce((sum: number, p: any) => sum + (p.catalog_items?.price || 0), 0);

    const revenueLast30d = purchasedItems.filter((p: any) => {
      return new Date(p.granted_at) >= last30d;
    }).reduce((sum: number, p: any) => sum + (p.catalog_items?.price || 0), 0);

    const revenueLastMonth = purchasedItems.filter((p: any) => {
      return new Date(p.granted_at) >= lastMonth;
    }).reduce((sum: number, p: any) => sum + (p.catalog_items?.price || 0), 0);

    // Les commandes incluent les achats ET les assignations manuelles
    const totalOrders = purchases?.length || 0;
    const ordersLast7d = (purchases || []).filter((p: any) => new Date(p.granted_at) >= last7d).length;
    const ordersLast30d = (purchases || []).filter((p: any) => new Date(p.granted_at) >= last30d).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Utilisateurs
    const { data: allUsers } = await supabase
      .from("profiles")
      .select("id, created_at");

    const totalUsers = allUsers?.length || 0;
    const newUsersLast7d = (allUsers || []).filter((u) => new Date(u.created_at) >= last7d).length;
    const newUsersLast30d = (allUsers || []).filter((u) => new Date(u.created_at) >= last30d).length;

    return {
      totalVisits: visitsLast30d, // Approximation
      uniqueVisitors,
      visitsLast7d,
      visitsLast30d,
      activeCarts,
      abandonedCarts,
      cartsInProgress,
      totalRevenue,
      revenueLast7d,
      revenueLast30d,
      revenueLastMonth,
      totalOrders,
      ordersLast7d,
      ordersLast30d,
      averageOrderValue,
      totalUsers,
      newUsersLast7d,
      newUsersLast30d,
    };
  } catch (error) {
    console.error("[jessica-dashboard] Error fetching stats:", error);
    throw error;
  }
}

