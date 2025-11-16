import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

/**
 * GET : Récupère le panier de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ items: [] });
    }

    const { data: cartItems, error } = await supabase
      .from("cart_items")
      .select("*")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) {
      console.error("[api/cart] Error fetching cart:", error);
      return NextResponse.json({ items: [] });
    }

    return NextResponse.json({
      items: cartItems || [],
    });
  } catch (error) {
    console.error("[api/cart] Error:", error);
    return NextResponse.json({ items: [] });
  }
}



