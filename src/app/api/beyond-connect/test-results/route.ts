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

    // Utiliser la vue beyond_connect_test_results
    const { data: results, error } = await supabase
      .from("beyond_connect_test_results")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[beyond-connect/test-results] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results: results || [] });
  } catch (error) {
    console.error("[beyond-connect/test-results] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


