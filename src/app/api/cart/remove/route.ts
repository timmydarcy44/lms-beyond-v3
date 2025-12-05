import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * POST : Retire un item du panier
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
    const { content_id, content_type } = body;

    if (!content_id || !content_type) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Le panier est géré via Zustand (local storage), pas via une table Supabase
    // La table cart_items n'existe pas, donc on retourne un succès
    // Le panier est synchronisé côté client via le store Zustand
    return NextResponse.json({ success: true, localOnly: true });
  } catch (error) {
    console.error("[api/cart/remove] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}





