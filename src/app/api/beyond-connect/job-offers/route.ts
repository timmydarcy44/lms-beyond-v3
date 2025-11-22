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

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");
    const isActive = searchParams.get("is_active");

    // Récupérer les organisations de l'utilisateur
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "instructor"]);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ jobOffers: [] });
    }

    const orgIds = memberships.map(m => m.org_id);

    // Récupérer les entreprises de ces organisations
    const { data: companies } = await supabase
      .from("beyond_connect_companies")
      .select("id")
      .in("organization_id", orgIds);

    if (!companies || companies.length === 0) {
      return NextResponse.json({ jobOffers: [] });
    }

    const companyIds = companies.map(c => c.id);

    let query = supabase
      .from("beyond_connect_job_offers")
      .select("*")
      .in("company_id", companyIds);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (isActive !== null) {
      query = query.eq("is_active", isActive === "true");
    }

    const { data: jobOffers, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[beyond-connect/job-offers] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobOffers: jobOffers || [] });
  } catch (error) {
    console.error("[beyond-connect/job-offers] Error:", error);
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
    const {
      company_id,
      title,
      description,
      company_presentation,
      contract_type,
      location,
      remote_allowed,
      salary_min,
      salary_max,
      currency,
      hours_per_week,
      required_skills,
      required_soft_skills,
      required_experience,
      required_education,
      benefits,
      application_deadline,
      is_active,
    } = body;

    if (!company_id || !title || !contract_type) {
      return NextResponse.json(
        { error: "company_id, title et contract_type sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur peut créer une offre pour cette entreprise
    const { data: company, error: companyError } = await supabase
      .from("beyond_connect_companies")
      .select(`
        id,
        organization_id,
        org_memberships!inner(user_id, role)
      `)
      .eq("id", company_id)
      .eq("org_memberships.user_id", user.id)
      .in("org_memberships.role", ["admin", "instructor"])
      .single();

    if (companyError || !company) {
      return NextResponse.json({ error: "Vous n'avez pas les droits pour créer une offre pour cette entreprise" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("beyond_connect_job_offers")
      .insert({
        company_id,
        created_by: user.id,
        title,
        description: description || "",
        company_presentation: company_presentation || null,
        contract_type,
        location: remote_allowed ? null : location,
        remote_allowed: remote_allowed || false,
        salary_min,
        salary_max,
        currency: currency || "EUR",
        hours_per_week,
        required_skills: required_skills || [],
        required_soft_skills: required_soft_skills || [],
        required_experience,
        required_education,
        benefits: benefits || [],
        application_deadline,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error("[beyond-connect/job-offers] Error creating job offer:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobOffer: data }, { status: 201 });
  } catch (error) {
    console.error("[beyond-connect/job-offers] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

