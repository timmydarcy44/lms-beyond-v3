import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Vérifie si un utilisateur a accès à un catalog_item
 * GET /api/jessica-contentin/check-access?catalogItemId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const catalogItemId = searchParams.get("catalogItemId");

    if (!catalogItemId) {
      return NextResponse.json(
        { error: "catalogItemId requis" },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase non configuré" },
        { status: 500 }
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { hasAccess: false, error: "Non authentifié" },
        { status: 401 }
      );
    }

    // Utiliser le service role client pour éviter les problèmes de RLS
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;

    // Vérifier si l'item existe et s'il est gratuit
    const { data: catalogItem } = await clientToUse
      .from("catalog_items")
      .select("id, is_free, creator_id")
      .eq("id", catalogItemId)
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json(
        { hasAccess: false, error: "Item non trouvé" },
        { status: 404 }
      );
    }

    // Si l'item est gratuit, l'accès est automatique
    if (catalogItem.is_free) {
      return NextResponse.json({
        hasAccess: true,
        accessType: "free",
        catalogItemId: catalogItem.id,
      });
    }

    // Si l'utilisateur est le créateur, il a accès
    if (catalogItem.creator_id === user.id) {
      return NextResponse.json({
        hasAccess: true,
        accessType: "creator",
        catalogItemId: catalogItem.id,
      });
    }

    // Vérifier l'accès dans catalog_access
    const { data: access } = await clientToUse
      .from("catalog_access")
      .select("access_status")
      .eq("user_id", user.id)
      .eq("catalog_item_id", catalogItemId)
      .in("access_status", ["purchased", "manually_granted", "free"])
      .maybeSingle();

    if (access) {
      return NextResponse.json({
        hasAccess: true,
        accessType: access.access_status,
        catalogItemId: catalogItem.id,
      });
    }

    // Pas d'accès
    return NextResponse.json({
      hasAccess: false,
      requiresPayment: true,
      catalogItemId: catalogItem.id,
    });
  } catch (error) {
    console.error("[jessica-contentin/check-access] Error:", error);
    return NextResponse.json(
      { hasAccess: false, error: "Erreur lors de la vérification" },
      { status: 500 }
    );
  }
}

