import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

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

    // Utiliser la vue beyond_connect_user_badges
    const { data: badges, error } = await supabase
      .from("beyond_connect_user_badges")
      .select("*")
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (error) {
      console.error("[beyond-connect/badges] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ badges: badges || [] });
  } catch (error) {
    console.error("[beyond-connect/badges] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

