import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Vérifier l'authentification et le rôle Super Admin
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const supabase = await getServerClient();
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;

    // Vérifier que l'item existe et appartient au Super Admin connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer l'item pour vérifier la propriété
    const { data: item, error: fetchError } = await clientToUse
      .from("catalog_items")
      .select("id, created_by, creator_id")
      .eq("id", id)
      .single();

    if (fetchError || !item) {
      return NextResponse.json({ error: "Item non trouvé" }, { status: 404 });
    }

    // Vérifier que l'item appartient au Super Admin connecté
    const isOwner = item.created_by === user.id || item.creator_id === user.id;
    if (!isOwner) {
      return NextResponse.json({ error: "Vous n'êtes pas autorisé à supprimer cet item" }, { status: 403 });
    }

    // Supprimer l'item (soft delete en mettant is_active à false, ou hard delete)
    const { error: deleteError } = await clientToUse
      .from("catalog_items")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("[api/catalogue/items] Error deleting item:", deleteError);
      return NextResponse.json({ 
        error: "Erreur lors de la suppression",
        details: deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Item supprimé avec succès" 
    });

  } catch (error) {
    console.error("[api/catalogue/items] Unexpected error:", error);
    return NextResponse.json({ 
      error: "Erreur serveur",
      details: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 });
  }
}



