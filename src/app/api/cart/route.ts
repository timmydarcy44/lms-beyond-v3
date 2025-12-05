import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * GET : Récupère le panier de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ items: [] });
    }
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ items: [] });
    }

    // Le panier est géré via Zustand (local storage), pas via une table Supabase
    // La table cart_items n'existe pas, donc on retourne un tableau vide
    // Le panier est synchronisé côté client via le store Zustand
    return NextResponse.json({
      items: [],
    });
  } catch (error) {
    console.error("[api/cart] Error:", error);
    return NextResponse.json({ items: [] });
  }
}





