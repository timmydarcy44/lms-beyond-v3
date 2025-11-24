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

    // Récupérer les organisations de l'utilisateur
    const { data: memberships, error: membershipsError } = await supabase
      .from("org_memberships")
      .select("org_id, role")
      .eq("user_id", user.id)
      .in("role", ["admin", "instructor"]);

    if (membershipsError) {
      console.error("[beyond-connect/companies] Error fetching memberships:", membershipsError);
      return NextResponse.json({ error: membershipsError.message }, { status: 500 });
    }

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ companies: [] });
    }

    const orgIds = memberships.map(m => m.org_id);

    // Récupérer les entreprises liées à ces organisations
    const { data: companies, error: companiesError } = await supabase
      .from("beyond_connect_companies")
      .select("*")
      .in("organization_id", orgIds);

    if (companiesError) {
      console.error("[beyond-connect/companies] Error fetching companies:", companiesError);
      return NextResponse.json({ error: companiesError.message }, { status: 500 });
    }

    return NextResponse.json({ companies: companies || [] });
  } catch (error) {
    console.error("[beyond-connect/companies] Error:", error);
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
    const { organization_id, name, description, industry, size, website, logo_url, is_premium } = body;

    if (!organization_id || !name) {
      return NextResponse.json({ error: "organization_id et name sont requis" }, { status: 400 });
    }

    // Vérifier que l'utilisateur est admin/instructor de l'organisation
    const { data: membership, error: membershipError } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", organization_id)
      .in("role", ["admin", "instructor"])
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Vous n'avez pas les droits pour créer une entreprise pour cette organisation" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_companies")
      .insert({
        organization_id,
        name,
        description,
        industry,
        size,
        website,
        logo_url,
        is_premium: is_premium || false,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/companies] Error creating company:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error) {
    console.error("[beyond-connect/companies] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


