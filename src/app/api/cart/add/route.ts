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

    // Vérifier si l'item existe déjà dans le panier
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id")
      .eq("user_id", user.id)
      .eq("content_id", content_id)
      .eq("content_type", content_type)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ message: "Item déjà dans le panier" });
    }

    // Ajouter au panier
    const { data, error } = await supabase
      .from("cart_items")
      .insert({
        user_id: user.id,
        content_id,
        content_type,
        title,
        price: parseFloat(String(price)),
        thumbnail_url: thumbnail_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error("[api/cart/add] Error:", error);
      console.error("[api/cart/add] Error details:", JSON.stringify(error, null, 2));
      
      // Si la table n'existe pas, retourner un succès quand même (panier local uniquement)
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        console.warn("[api/cart/add] cart_items table does not exist, using local storage only");
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
      }
      
      return NextResponse.json({ 
        error: "Erreur lors de l'ajout au panier",
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  } catch (error) {
    console.error("[api/cart/add] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

