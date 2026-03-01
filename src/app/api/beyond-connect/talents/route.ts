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

    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "instructor"]);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ talents: [] });
    }

    const { data: talents, error } = await supabase
      .from("profiles_talent")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[beyond-connect/talents] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ talents: talents || [] });
  } catch (error) {
    console.error("[beyond-connect/talents] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
