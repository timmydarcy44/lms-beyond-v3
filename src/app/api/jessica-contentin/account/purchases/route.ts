import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { jessicaCatalogItemsOrFilter } from "@/lib/jessica-contentin/catalog-ownership";
import {
  catalogItemsTableExists,
  fetchJessicaAssignableCatalogItems,
  fetchJessicaCourseEnrollmentsForUsers,
  getJessicaStudioCourseIds,
  isJessicaAssignableCatalogItem,
} from "@/lib/jessica-contentin/sync-jessica-catalog";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const jessicaProfileId = searchParams.get("jessicaProfileId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId requis" },
        { status: 400 }
      );
    }

    // Utiliser le service role client pour éviter les problèmes de RLS
    const supabase = getServiceRoleClient() || await getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    // Si l'utilisateur est Jessica Contentin elle-même, elle a accès à tous ses contenus
    // même sans entrée dans catalog_access (car elle est le créateur)
    const isJessicaHerself = jessicaProfileId && String(userId) === String(jessicaProfileId);
    
    if (isJessicaHerself) {
      const hasCatalog = await catalogItemsTableExists(supabase);
      if (hasCatalog) {
        const { data: allItems, error: itemsError } = await supabase
          .from("catalog_items")
          .select(`
            id, title, item_type, thumbnail_url, hero_image_url, content_id, price, creator_id, created_by, slug
          `)
          .or(jessicaCatalogItemsOrFilter(String(jessicaProfileId)))
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(100);

        if (!itemsError && allItems?.length) {
          const purchases = allItems.map((item: any) => ({
            id: `jessica-${item.id}`,
            catalog_item_id: item.id,
            user_id: userId,
            organization_id: null,
            granted_at: new Date().toISOString(),
            access_status: "manually_granted" as const,
            purchase_amount: item.price || 0,
            purchase_date: new Date().toISOString(),
            catalog_items: {
              id: item.id,
              title: item.title,
              item_type: item.item_type,
              thumbnail_url: item.thumbnail_url,
              hero_image_url: item.hero_image_url,
              content_id: item.content_id,
              price: item.price || 0,
              creator_id: item.creator_id,
              created_by: item.created_by,
              slug: null,
            },
          }));
          return NextResponse.json({ data: purchases, error: null });
        }
      }

      const studioItems = await fetchJessicaAssignableCatalogItems(supabase);
      const purchases = studioItems.map((item) => ({
        id: `jessica-${item.id}`,
        catalog_item_id: item.id,
        user_id: userId,
        organization_id: null,
        granted_at: new Date().toISOString(),
        access_status: "manually_granted" as const,
        purchase_amount: 0,
        purchase_date: new Date().toISOString(),
        catalog_items: {
          id: item.id,
          title: item.title,
          item_type: item.item_type,
          thumbnail_url: null,
          hero_image_url: null,
          content_id: item.content_id,
          price: 0,
          creator_id: jessicaProfileId,
          created_by: jessicaProfileId,
          slug: null,
        },
      }));
      return NextResponse.json({ data: purchases, error: null });
    }

    // Pour les autres utilisateurs, récupérer les accès depuis catalog_access
    // IMPORTANT: user_id dans catalog_access correspond à profiles.id (qui est aussi auth.users.id)
    // Dans Supabase, profiles.id = auth.users.id, donc pas de colonne user_id séparée
    
    // D'abord, récupérer le profil pour vérifier que l'utilisateur existe
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", userId) // profiles.id = auth.users.id
      .maybeSingle();
    
    // Utiliser directement userId (qui est profiles.id = auth.users.id)
    const actualUserId = userId;
    
    console.log("[api/jessica-contentin/account/purchases] User lookup:", {
      providedUserId: userId,
      foundProfile: !!userProfile,
      profileId: userProfile?.id,
      actualUserId,
    });
    
    const hasCatalog = await catalogItemsTableExists(supabase);
    let filteredAccess: any[] = [];
    let catalogError: { code?: string; message?: string } | null = null;

    if (hasCatalog) {
      const { data: access, error } = await supabase
        .from("catalog_access")
        .select(`
          id,
          catalog_item_id,
          user_id,
          organization_id,
          granted_at,
          access_status,
          purchase_amount,
          purchase_date,
          catalog_items (
            id, title, item_type, thumbnail_url, hero_image_url, content_id, price, creator_id, created_by
          )
        `)
        .eq("user_id", actualUserId)
        .is("organization_id", null)
        .in("access_status", ["purchased", "manually_granted", "free"])
        .order("granted_at", { ascending: false })
        .limit(50);

      catalogError = error;
      filteredAccess = access || [];

      if (jessicaProfileId && filteredAccess.length > 0) {
        const studioCourseIds = await getJessicaStudioCourseIds(supabase);
        filteredAccess = filteredAccess.filter((item: any) => {
          const catalogItem = item.catalog_items;
          if (!catalogItem) return false;
          return isJessicaAssignableCatalogItem(catalogItem, String(jessicaProfileId), studioCourseIds);
        });
      }
    }

    const enrollments = await fetchJessicaCourseEnrollmentsForUsers(supabase, [actualUserId]);
    const enrollmentPurchases = enrollments.map((e) => ({
      id: `enrollment-${e.id}`,
      catalog_item_id: e.course_id,
      user_id: actualUserId,
      organization_id: null,
      granted_at: e.created_at || new Date().toISOString(),
      access_status: "manually_granted",
      purchase_amount: 0,
      purchase_date: e.created_at || new Date().toISOString(),
      catalog_items: {
        id: e.course_id,
        title: e.courses?.title || "Formation",
        item_type: "module",
        thumbnail_url: e.courses?.cover_image ?? null,
        hero_image_url: e.courses?.cover_image ?? null,
        content_id: e.course_id,
        price: 0,
        creator_id: jessicaProfileId,
        created_by: jessicaProfileId,
      },
    }));

    const existingContentIds = new Set(
      filteredAccess.map((a) => a.catalog_items?.content_id).filter(Boolean),
    );
    const merged = [
      ...filteredAccess,
      ...enrollmentPurchases.filter((p) => !existingContentIds.has(p.catalog_items.content_id)),
    ];

    if (catalogError && catalogError.code !== "42P01" && catalogError.code !== "42501" && catalogError.code !== "PGRST205") {
      return NextResponse.json(
        { error: "Erreur lors de la récupération des achats", details: catalogError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: merged, error: null });
  } catch (error) {
    console.error("[api/jessica-contentin/account/purchases] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des achats", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
