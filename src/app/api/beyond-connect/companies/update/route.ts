import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
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
    const {
      company_id,
      name,
      industry,
      size,
      description,
      website,
      logo_url,
      slogan,
      values,
      company_type,
      city,
    } = body || {};

    if (!company_id) {
      return NextResponse.json({ error: "company_id est requis" }, { status: 400 });
    }

    const { data: company, error: companyError } = await supabase
      .from("beyond_connect_companies")
      .select("id, organization_id")
      .eq("id", company_id)
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Entreprise introuvable" }, { status: 404 });
    }

    const { data: membership, error: membershipError } = await supabase
      .from("org_memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("org_id", company.organization_id)
      .in("role", ["admin", "instructor"])
      .single();

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const updates: Record<string, any> = {
      name,
      industry,
      size,
      description,
      website,
      logo_url,
      slogan,
      values,
      company_type,
      city,
    };

    const { data, error } = await supabase
      .from("beyond_connect_companies")
      .update(updates)
      .eq("id", company_id)
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/companies/update] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data });
  } catch (error) {
    console.error("[beyond-connect/companies/update] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
