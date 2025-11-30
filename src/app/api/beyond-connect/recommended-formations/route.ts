import { NextRequest, NextResponse } from "next/server";
import { getCatalogItems } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les formations Beyond No School recommandées pour améliorer le profil
 * GET /api/beyond-connect/recommended-formations
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les formations Beyond No School (modules pour apprenants)
    const items = await getCatalogItems(
      undefined, // pas d'organisation
      "learner", // rôle apprenant
      user.id, // utilisateur B2C
      undefined // pas de super admin spécifique
    );

    // Filtrer uniquement les modules actifs
    const modules = items
      .filter((item: any) => item.item_type === "module" && item.is_active)
      .slice(0, 6) // Limiter à 6 formations
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        cover_image: item.hero_image_url || item.thumbnail_url || null,
        price: item.price,
        item_type: item.item_type,
      }));

    return NextResponse.json({ formations: modules });
  } catch (error) {
    console.error("[api/beyond-connect/recommended-formations] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des formations" },
      { status: 500 }
    );
  }
}

