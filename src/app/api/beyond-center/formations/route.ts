import { NextResponse } from "next/server";
import { getCatalogItems } from "@/lib/queries/catalogue";
import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function GET() {
  try {
    console.log("[api/beyond-center/formations] Fetching formations...");
    
    // Récupérer l'ID de Jessica Contentin pour l'exclure
    const supabase = getServiceRoleClient();
    let jessicaId: string | null = null;
    
    if (supabase) {
      const { data: jessicaProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", JESSICA_CONTENTIN_EMAIL)
        .maybeSingle();
      
      if (jessicaProfile) {
        jessicaId = jessicaProfile.id;
        console.log("[api/beyond-center/formations] Jessica Contentin ID found:", jessicaId);
      }
    }
    
    // Récupérer les formations Beyond No School (modules pour apprenants)
    const items = await getCatalogItems(
      undefined, // pas d'organisation
      "learner", // rôle apprenant
      undefined, // pas d'utilisateur spécifique
      undefined // pas de super admin spécifique
    );

    console.log("[api/beyond-center/formations] Total items found:", items.length);

    // Filtrer uniquement les modules, exclure ceux de Jessica, et prendre les 6 premiers
    // Note: getCatalogItems retourne les items avec tous les champs de catalog_items, y compris creator_id
    const modules = items
      .filter((item: any) => {
        // Filtrer par type
        if (item.item_type !== "module") return false;
        
        // Exclure les modules créés par Jessica Contentin
        if (jessicaId && item.creator_id === jessicaId) {
          console.log(`[api/beyond-center/formations] Excluding Jessica's module: ${item.title} (creator_id: ${item.creator_id})`);
          return false;
        }
        
        return true;
      })
      .slice(0, 6)
      .map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description,
        cover_image: item.hero_image_url || item.thumbnail_url || null,
        price: item.price,
        item_type: item.item_type,
      }));

    console.log("[api/beyond-center/formations] Modules found (excluding Jessica's):", modules.length);

    return NextResponse.json({ formations: modules });
  } catch (error) {
    console.error("[api/beyond-center/formations] Error:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de la récupération des formations",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

