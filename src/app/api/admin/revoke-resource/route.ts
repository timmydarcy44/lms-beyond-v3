import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { userId, catalogItemId } = body;

    if (!userId || !catalogItemId) {
      return NextResponse.json(
        { error: "userId et catalogItemId sont requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 503 }
      );
    }

    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      return NextResponse.json(
        { error: "Profil Jessica Contentin non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que le catalog_item appartient à Jessica
    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("id, title, creator_id")
      .eq("id", catalogItemId)
      .eq("creator_id", jessicaProfile.id)
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Ressource non trouvée ou n'appartient pas à Jessica" },
        { status: 404 }
      );
    }

    // Vérifier que l'accès existe et qu'il s'agit d'un accès manuel
    const { data: existingAccess } = await supabase
      .from("catalog_access")
      .select("id, access_status")
      .eq("user_id", userId)
      .eq("catalog_item_id", catalogItemId)
      .is("organization_id", null)
      .maybeSingle();

    if (!existingAccess) {
      return NextResponse.json(
        { error: "Accès non trouvé" },
        { status: 404 }
      );
    }

    // Ne permettre de retirer que les accès manuels (pas les achats)
    if (existingAccess.access_status !== "manually_granted") {
      return NextResponse.json(
        { error: "Seuls les accès manuels peuvent être retirés" },
        { status: 400 }
      );
    }

    // Supprimer l'accès
    const { error: deleteError } = await supabase
      .from("catalog_access")
      .delete()
      .eq("id", existingAccess.id);

    if (deleteError) {
      console.error("[admin/revoke-resource] Error deleting access:", deleteError);
      return NextResponse.json(
        { error: "Erreur lors de la suppression de l'accès" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Accès retiré avec succès",
    });
  } catch (error: any) {
    console.error("[admin/revoke-resource] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors du retrait de l'accès" },
      { status: 500 }
    );
  }
}

