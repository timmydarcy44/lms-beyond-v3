import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer les indicateurs de l'utilisateur
    const { data: indicators, error } = await supabase
      .from("mental_health_indicators")
      .select("*")
      .eq("user_id", user.id)
      .order("week_start_date", { ascending: false });

    if (error) {
      console.error("[mental-health/indicators] Error fetching indicators:", error);
      return NextResponse.json(
        { error: "Erreur lors de la récupération des indicateurs" },
        { status: 500 }
      );
    }

    return NextResponse.json({ indicators: indicators || [] });
  } catch (error) {
    console.error("[mental-health/indicators] Unexpected error:", error);
    return NextResponse.json(
      { error: "Erreur inattendue" },
      { status: 500 }
    );
  }
}







