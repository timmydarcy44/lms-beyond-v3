import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

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
    const { name, description, company_type, industry, city, logo_url, website, slogan, values } = body || {};

    if (!name) {
      return NextResponse.json({ error: "name est requis" }, { status: 400 });
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "instructor"])
      .limit(1);

    if (membershipsError || !memberships || memberships.length === 0) {
      return NextResponse.json({ error: "Aucune organisation trouvée" }, { status: 403 });
    }

    const organizationId = memberships[0].org_id;

    const { data, error } = await supabase
      .from("beyond_connect_companies")
      .insert({
        organization_id: organizationId,
        name,
        description: description || "",
        industry: industry || "",
        size: company_type || "",
        company_type: company_type || "",
        city: city || "",
        logo_url: logo_url || "",
        website: website || "",
        slogan: slogan || "",
        values: values || "",
        is_premium: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/companies/create-onboarding] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ company: data }, { status: 201 });
  } catch (error) {
    console.error("[beyond-connect/companies/create-onboarding] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
