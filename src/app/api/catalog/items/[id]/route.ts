import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
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

    // Vérifier que l'item appartient à Jessica
    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("id, creator_id")
      .eq("id", id)
      .eq("creator_id", jessicaProfile.id)
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Contenu non trouvé ou n'appartient pas à Jessica" },
        { status: 404 }
      );
    }

    // Supprimer l'item
    const { error } = await supabase
      .from("catalog_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[api/catalog/items] Error deleting:", error);
      return NextResponse.json(
        { error: "Erreur lors de la suppression" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[api/catalog/items] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { is_active } = body;

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

    // Vérifier que l'item appartient à Jessica
    const { data: catalogItem } = await supabase
      .from("catalog_items")
      .select("id, creator_id")
      .eq("id", id)
      .eq("creator_id", jessicaProfile.id)
      .maybeSingle();

    if (!catalogItem) {
      return NextResponse.json(
        { error: "Contenu non trouvé ou n'appartient pas à Jessica" },
        { status: 404 }
      );
    }

    // Mettre à jour l'item
    const { data, error } = await supabase
      .from("catalog_items")
      .update({ is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[api/catalog/items] Error updating:", error);
      return NextResponse.json(
        { error: "Erreur lors de la modification" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[api/catalog/items] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la modification" },
      { status: 500 }
    );
  }
}

