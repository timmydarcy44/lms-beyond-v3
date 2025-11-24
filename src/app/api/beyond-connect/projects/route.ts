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

    const { data: projects, error } = await supabase
      .from("beyond_connect_projects")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[beyond-connect/projects] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ projects: projects || [] });
  } catch (error) {
    console.error("[beyond-connect/projects] Error:", error);
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
    const { title, description, url, start_date, end_date, technologies } = body;

    if (!title) {
      return NextResponse.json({ error: "Titre requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_projects")
      .insert({
        user_id: user.id,
        title,
        description,
        url,
        start_date,
        end_date,
        technologies: technologies || [],
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/projects] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error("[beyond-connect/projects] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


