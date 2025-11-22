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

    const { data: experiences, error } = await supabase
      .from("beyond_connect_experiences")
      .select("*")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false });

    if (error) {
      console.error("[beyond-connect/experiences] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ experiences: experiences || [] });
  } catch (error) {
    console.error("[beyond-connect/experiences] Error:", error);
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
    const { title, company, description, start_date, end_date, is_current, location } = body;

    if (!title || !company || !start_date) {
      return NextResponse.json({ error: "Titre, entreprise et date de début requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_experiences")
      .insert({
        user_id: user.id,
        title,
        company,
        description,
        start_date,
        end_date: is_current ? null : end_date,
        is_current: is_current || false,
        location,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/experiences] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ experience: data });
  } catch (error) {
    console.error("[beyond-connect/experiences] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

