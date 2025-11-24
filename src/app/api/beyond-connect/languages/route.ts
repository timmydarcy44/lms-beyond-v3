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

    const { data: languages, error } = await supabase
      .from("beyond_connect_languages")
      .select("*")
      .eq("user_id", user.id)
      .order("language", { ascending: true });

    if (error) {
      console.error("[beyond-connect/languages] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ languages: languages || [] });
  } catch (error) {
    console.error("[beyond-connect/languages] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { language, level } = body;

    if (!language || !level) {
      return NextResponse.json({ error: "Langue et niveau requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_languages")
      .insert({
        user_id: user.id,
        language,
        level,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/languages] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ language: data });
  } catch (error) {
    console.error("[beyond-connect/languages] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


