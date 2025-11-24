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

    const { data: paths, error } = await supabase
      .from("paths")
      .select("id, title, status")
      .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[api/formateur/paths] Erreur:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    return NextResponse.json({ paths: paths || [] });
  } catch (error) {
    console.error("[api/formateur/paths] Erreur inattendue:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}









