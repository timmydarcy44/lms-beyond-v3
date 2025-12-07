import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

/**
 * Route de test pour vérifier qu'un utilisateur a bien accès à une ressource après un achat
 * 
 * Usage:
 * GET /api/test/verify-access?email=user@example.com&catalogItemId=xxx
 * ou
 * GET /api/test/verify-access?userId=xxx&catalogItemId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get("email");
    const userId = searchParams.get("userId");
    const catalogItemId = searchParams.get("catalogItemId");

    if (!catalogItemId) {
      return NextResponse.json(
        { error: "catalogItemId est requis" },
        { status: 400 }
      );
    }

    if (!email && !userId) {
      return NextResponse.json(
        { error: "email ou userId est requis" },
        { status: 400 }
      );
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: "Service non disponible" },
        { status: 500 }
      );
    }

    // Trouver l'utilisateur
    let userProfile: { id: string; email: string } | null = null;

    if (userId) {
      const { data: profile, error: profileError } = await serviceClient
        .from("profiles")
        .select("id, email")
        .eq("id", userId)
        .maybeSingle();

      if (profileError) {
        return NextResponse.json(
          { error: `Erreur lors de la recherche de l'utilisateur: ${profileError.message}` },
          { status: 500 }
        );
      }

      if (!profile) {
        return NextResponse.json(
          { error: `Utilisateur non trouvé avec l'ID: ${userId}` },
          { status: 404 }
        );
      }

      userProfile = profile;
    } else if (email) {
      const { data: profile, error: profileError } = await serviceClient
        .from("profiles")
        .select("id, email")
        .eq("email", email)
        .maybeSingle();

      if (profileError) {
        return NextResponse.json(
          { error: `Erreur lors de la recherche de l'utilisateur: ${profileError.message}` },
          { status: 500 }
        );
      }

      if (!profile) {
        return NextResponse.json(
          { error: `Utilisateur non trouvé avec l'email: ${email}` },
          { status: 404 }
        );
      }

      userProfile = profile;
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: "Impossible de trouver l'utilisateur" },
        { status: 404 }
      );
    }

    // Vérifier que le catalog_item existe
    const { data: catalogItem, error: catalogItemError } = await serviceClient
      .from("catalog_items")
      .select("id, title, item_type, content_id, price, is_free")
      .eq("id", catalogItemId)
      .maybeSingle();

    if (catalogItemError) {
      return NextResponse.json(
        { error: `Erreur lors de la recherche du catalog_item: ${catalogItemError.message}` },
        { status: 500 }
      );
    }

    if (!catalogItem) {
      return NextResponse.json(
        { error: `Catalog item non trouvé avec l'ID: ${catalogItemId}` },
        { status: 404 }
      );
    }

    // Vérifier l'accès dans catalog_access
    const { data: access, error: accessError } = await serviceClient
      .from("catalog_access")
      .select("id, access_status, granted_at, purchase_amount, purchase_date, transaction_id")
      .eq("user_id", userProfile.id)
      .eq("catalog_item_id", catalogItemId)
      .maybeSingle();

    if (accessError) {
      return NextResponse.json(
        { error: `Erreur lors de la vérification de l'accès: ${accessError.message}` },
        { status: 500 }
      );
    }

    // Vérifier si la ressource est gratuite
    const isFree = catalogItem.is_free || catalogItem.price === 0;

    // Déterminer si l'utilisateur a accès
    const hasAccess = !!access && ["purchased", "manually_granted", "free"].includes(access.access_status);

    // Vérifier si l'utilisateur est le créateur
    const { data: creatorCheck } = await serviceClient
      .from("catalog_items")
      .select("created_by")
      .eq("id", catalogItemId)
      .maybeSingle();

    const isCreator = creatorCheck?.created_by === userProfile.id;

    // Résultat final
    const result = {
      user: {
        id: userProfile.id,
        email: userProfile.email,
      },
      catalogItem: {
        id: catalogItem.id,
        title: catalogItem.title,
        item_type: catalogItem.item_type,
        price: catalogItem.price,
        is_free: isFree,
      },
      access: access
        ? {
            id: access.id,
            access_status: access.access_status,
            granted_at: access.granted_at,
            purchase_amount: access.purchase_amount,
            purchase_date: access.purchase_date,
            transaction_id: access.transaction_id,
          }
        : null,
      accessCheck: {
        hasAccess: hasAccess || isFree || isCreator,
        isFree: isFree,
        isCreator: isCreator,
        hasExplicitAccess: hasAccess,
        reason: isCreator
          ? "Créateur de la ressource"
          : isFree
          ? "Ressource gratuite"
          : hasAccess
          ? `Accès accordé (${access?.access_status})`
          : "Aucun accès trouvé",
      },
      recommendation: !hasAccess && !isFree && !isCreator
        ? "L'utilisateur n'a pas accès à cette ressource. Vérifiez que l'achat a bien été traité par le webhook Stripe."
        : "L'utilisateur a accès à cette ressource.",
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[test/verify-access] Error:", error);
    return NextResponse.json(
      {
        error: "Erreur serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

