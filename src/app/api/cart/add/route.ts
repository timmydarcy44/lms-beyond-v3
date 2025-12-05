import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * POST : Ajoute un item au panier
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { content_id, content_type, title, price, thumbnail_url } = body;

    if (!content_id || !content_type || !title || price === undefined) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Le panier est géré via Zustand (local storage), pas via une table Supabase
    // La table cart_items n'existe pas, donc on retourne un succès avec les données
    // Le panier est synchronisé côté client via le store Zustand
    return NextResponse.json({ 
      item: {
        id: `${content_id}-${content_type}`,
        user_id: user.id,
        content_id,
        content_type,
        title,
        price: parseFloat(String(price)),
        thumbnail_url: thumbnail_url || null,
        added_at: new Date().toISOString(),
      },
      localOnly: true 
    });
  } catch (error) {
    console.error("[api/cart/add] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

