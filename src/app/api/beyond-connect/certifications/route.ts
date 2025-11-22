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

    const { data: certifications, error } = await supabase
      .from("beyond_connect_certifications")
      .select("*")
      .eq("user_id", user.id)
      .order("issue_date", { ascending: false, nullsFirst: false });

    if (error) {
      console.error("[beyond-connect/certifications] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ certifications: certifications || [] });
  } catch (error) {
    console.error("[beyond-connect/certifications] Error:", error);
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
    const { name, issuer, issue_date, expiry_date, credential_id, credential_url } = body;

    if (!name || !issuer) {
      return NextResponse.json({ error: "Nom et émetteur requis" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_certifications")
      .insert({
        user_id: user.id,
        name,
        issuer,
        issue_date,
        expiry_date,
        credential_id,
        credential_url,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/certifications] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ certification: data });
  } catch (error) {
    console.error("[beyond-connect/certifications] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

