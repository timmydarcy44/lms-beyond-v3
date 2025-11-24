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

    const { data: education, error } = await supabase
      .from("beyond_connect_education")
      .select("*")
      .eq("user_id", user.id)
      .order("end_date", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[beyond-connect/education] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ education: education || [] });
  } catch (error) {
    console.error("[beyond-connect/education] Error:", error);
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
    const { degree, institution, field_of_study, description, start_date, end_date, is_current, grade } = body;

    if (!degree || !institution) {
      return NextResponse.json({ error: "Diplôme et établissement requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_education")
      .insert({
        user_id: user.id,
        degree,
        institution,
        field_of_study,
        description,
        start_date,
        end_date: is_current ? null : end_date,
        is_current: is_current || false,
        grade,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/education] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ education: data });
  } catch (error) {
    console.error("[beyond-connect/education] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


