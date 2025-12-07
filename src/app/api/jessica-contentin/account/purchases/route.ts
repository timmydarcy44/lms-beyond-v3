import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

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
      console.log("[api/jessica-contentin/account/purchases] User is Jessica Contentin herself, returning all her catalog items as purchases");
      
      // Récupérer tous les catalog_items créés par Jessica
      const { data: allItems, error: itemsError } = await supabase
        .from("catalog_items")
        .select(`
          id,
          title,
          item_type,
          thumbnail_url,
          hero_image_url,
          content_id,
          price,
          creator_id,
          created_by,
          slug
        `)
        .eq("created_by", jessicaProfileId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(100);

      if (itemsError) {
        console.error("[api/jessica-contentin/account/purchases] Error fetching Jessica's items:", itemsError);
        return NextResponse.json({ data: [], error: null });
      }

      // Transformer les catalog_items en format "purchases" pour Jessica
      const purchases = (allItems || []).map((item: any) => ({
        id: `jessica-${item.id}`, // ID unique pour chaque "achat"
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
          slug: item.slug,
        },
      }));

      console.log("[api/jessica-contentin/account/purchases] Returning", purchases.length, "items for Jessica");
      return NextResponse.json({ data: purchases, error: null });
    }

    // Pour les autres utilisateurs, récupérer les accès depuis catalog_access
    // IMPORTANT: user_id dans catalog_access correspond à profiles.user_id (qui est auth.users.id)
    // Mais on peut aussi recevoir profiles.id, donc on doit vérifier les deux
    
    // D'abord, récupérer le profil pour obtenir le user_id correct
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("id, user_id, email")
      .or(`id.eq.${userId},user_id.eq.${userId}`)
      .maybeSingle();
    
    // Utiliser le user_id du profil (auth.users.id) pour la requête catalog_access
    const actualUserId = userProfile?.user_id || userId;
    
    console.log("[api/jessica-contentin/account/purchases] User lookup:", {
      providedUserId: userId,
      foundProfile: !!userProfile,
      profileId: userProfile?.id,
      profileUserId: userProfile?.user_id,
      actualUserId,
    });
    
    let query = supabase
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
          id,
          title,
          item_type,
          thumbnail_url,
          hero_image_url,
          content_id,
          price,
          creator_id,
          created_by,
          slug
        )
      `)
      .eq("user_id", actualUserId) // Utiliser le user_id correct (auth.users.id)
      .is("organization_id", null) // S'assurer que c'est un accès B2C (pas B2B)
      .in("access_status", ["purchased", "manually_granted", "free"])
      .order("granted_at", { ascending: false })
      .limit(50);

    const { data: access, error } = await query;

    // Log de diagnostic détaillé
    console.log("[api/jessica-contentin/account/purchases] Query details:", {
      userId,
      isJessicaHerself,
      queryParams: {
        user_id: userId,
        organization_id: "IS NULL",
        access_status: ["purchased", "manually_granted", "free"],
      },
    });

    console.log("[api/jessica-contentin/account/purchases] Raw access data:", {
      userId,
      jessicaProfileId,
      accessCount: access?.length || 0,
      error: error ? {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      } : null,
    });

    // Filtrer uniquement les contenus de Jessica Contentin côté serveur si on a son ID
    let filteredAccess = access || [];
    if (jessicaProfileId && filteredAccess.length > 0) {
      const beforeCount = filteredAccess.length;
      filteredAccess = filteredAccess.filter((item: any) => {
        const hasCatalogItem = !!item.catalog_items;
        const creatorId = item.catalog_items?.creator_id || item.catalog_items?.created_by;
        const creatorMatches = String(creatorId) === String(jessicaProfileId);
        return hasCatalogItem && creatorMatches;
      });
      console.log("[api/jessica-contentin/account/purchases] Filtered access (Jessica only):", {
        before: beforeCount,
        after: filteredAccess.length,
      });
    }

    if (error) {
      console.error("[api/jessica-contentin/account/purchases] Error:", error);
      if (error.code !== '42P01' && error.code !== '42501') {
        return NextResponse.json(
          { error: "Erreur lors de la récupération des achats", details: error.message },
          { status: 500 }
        );
      }
      return NextResponse.json({ data: [], error: null });
    }

    return NextResponse.json({ data: filteredAccess, error: null });
  } catch (error) {
    console.error("[api/jessica-contentin/account/purchases] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des achats", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}
