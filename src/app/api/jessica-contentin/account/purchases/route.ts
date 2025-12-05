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

    // Récupérer les achats depuis catalog_access (table correcte pour les accès B2C)
    // Utiliser une requête optimisée avec limite
    // IMPORTANT: Vérifier que user_id n'est pas NULL (accès B2C uniquement)
    // Utiliser LEFT JOIN au lieu de INNER JOIN pour voir tous les accès même si catalog_item n'existe pas
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
          created_by
        )
      `)
      .eq("user_id", userId)
      .is("organization_id", null) // S'assurer que c'est un accès B2C (pas B2B)
      .in("access_status", ["purchased", "manually_granted", "free"])
      .order("granted_at", { ascending: false })
      .limit(50); // Limiter à 50 résultats

    const { data: access, error } = await query;

    // Vérifier si des accès existent sans catalog_item (problème de jointure)
    if (access && access.length > 0) {
      const accessWithoutCatalogItem = access.filter((a: any) => !a.catalog_items);
      if (accessWithoutCatalogItem.length > 0) {
        console.warn("[api/jessica-contentin/account/purchases] ⚠️ Found access without catalog_item:", {
          count: accessWithoutCatalogItem.length,
          catalog_item_ids: accessWithoutCatalogItem.map((a: any) => a.catalog_item_id),
        });
      }
    }

    // Log de diagnostic détaillé
    console.log("[api/jessica-contentin/account/purchases] Query details:", {
      userId,
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
      access: access?.map((a: any) => ({
        id: a.id,
        catalog_item_id: a.catalog_item_id,
        user_id: a.user_id,
        organization_id: a.organization_id,
        access_status: a.access_status,
        granted_at: a.granted_at,
        catalog_item: a.catalog_items ? {
          id: a.catalog_items.id,
          title: a.catalog_items.title,
          creator_id: a.catalog_items.creator_id,
          created_by: a.catalog_items.created_by,
        } : null,
      })) || [],
    });

    // Vérifier s'il y a des accès avec organization_id au lieu de user_id (erreur de configuration)
    if (access && access.length === 0) {
      const { data: accessWithOrg } = await supabase
        .from("catalog_access")
        .select("id, user_id, organization_id, catalog_item_id, access_status")
        .or(`user_id.eq.${userId},organization_id.is.not.null`)
        .in("access_status", ["purchased", "manually_granted", "free"])
        .limit(5);
      
      console.log("[api/jessica-contentin/account/purchases] ⚠️ No access found with user_id, checking for organization_id access:", {
        found: accessWithOrg?.length || 0,
        samples: accessWithOrg?.slice(0, 3) || [],
      });
    }

    // Filtrer uniquement les contenus de Jessica Contentin côté serveur si on a son ID
    // (Le filtre dans la requête Supabase ne fonctionne pas toujours correctement avec les joins)
    let filteredAccess = access || [];
    if (jessicaProfileId && filteredAccess.length > 0) {
      const beforeCount = filteredAccess.length;
      filteredAccess = filteredAccess.filter((item: any) => {
        const hasCatalogItem = !!item.catalog_items;
        // Comparer les IDs en string pour éviter les problèmes de type
        // Vérifier à la fois creator_id et created_by
        const creatorId = item.catalog_items?.creator_id || item.catalog_items?.created_by;
        const creatorMatches = String(creatorId) === String(jessicaProfileId);
        
        if (!hasCatalogItem) {
          console.warn("[api/jessica-contentin/account/purchases] Item without catalog_items:", item);
        } else if (!creatorMatches) {
          console.log("[api/jessica-contentin/account/purchases] Item filtered out (wrong creator):", {
            catalog_item_id: item.catalog_item_id,
            item_creator_id: item.catalog_items.creator_id,
            item_created_by: item.catalog_items.created_by,
            item_creator_id_type: typeof item.catalog_items.creator_id,
            jessicaProfileId,
            jessicaProfileId_type: typeof jessicaProfileId,
            title: item.catalog_items.title,
            match: String(creatorId) === String(jessicaProfileId),
          });
        }
        
        return hasCatalogItem && creatorMatches;
      });
      console.log("[api/jessica-contentin/account/purchases] Filtered access (Jessica only):", {
        before: beforeCount,
        after: filteredAccess.length,
        jessicaProfileId,
        jessicaProfileId_type: typeof jessicaProfileId,
      });
    } else if (!jessicaProfileId) {
      console.warn("[api/jessica-contentin/account/purchases] No jessicaProfileId provided, returning all access");
    }

    if (error) {
      console.error("[api/jessica-contentin/account/purchases] Error:", error);
      // Ne pas bloquer si c'est juste une erreur de permissions
      if (error.code !== '42P01' && error.code !== '42501') {
        return NextResponse.json(
          { error: "Erreur lors de la récupération des achats", details: error.message },
          { status: 500 }
        );
      }
      // Si c'est une erreur de permissions, retourner un tableau vide
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

