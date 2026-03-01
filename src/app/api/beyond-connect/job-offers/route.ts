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

    let query = supabase
      .from("job_offers")
      .select("*")
      .eq("company_id", user.id);

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
      contract_type,
      location,
      remote_policy,
      weekend_work,
      salary_min,
      salary_max,
      tjm_range,
      mission_duration,
      objectives,
      scope_brief,
      deliverables,
      required_soft_skills,
      benefits,
      start_date,
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
      .from("job_offers")
      .insert({
        company_id,
        created_by: user.id,
        title,
        description: description || "",
        contract_type,
        location,
        remote_policy: remote_policy || null,
        weekend_work: weekend_work || null,
        salary_min,
        salary_max,
        tjm_range: tjm_range || null,
        mission_duration: mission_duration || null,
        objectives: objectives || null,
        scope_brief: scope_brief || null,
        deliverables: deliverables || null,
        required_soft_skills: required_soft_skills || [],
        benefits: benefits || [],
        start_date,
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

