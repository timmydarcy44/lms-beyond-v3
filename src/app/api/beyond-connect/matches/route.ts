import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les matchings pour une entreprise ou une offre
 * GET /api/beyond-connect/matches?company_id=xxx&job_offer_id=xxx
 */
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
    const jobOfferId = searchParams.get("job_offer_id");

    // Récupérer les organisations de l'utilisateur
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "instructor"]);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const orgIds = memberships.map(m => m.org_id);

    // Récupérer les entreprises de ces organisations
    const { data: companies } = await supabase
      .from("beyond_connect_companies")
      .select("id")
      .in("organization_id", orgIds);

    if (!companies || companies.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    const companyIds = companies.map(c => c.id);

    let query = supabase
      .from("beyond_connect_matches")
      .select(`
        *,
        beyond_connect_companies(
          id,
          name,
          is_premium
        ),
        beyond_connect_job_offers(
          id,
          title,
          contract_type
        ),
        profiles!beyond_connect_matches_user_id_fkey(
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .in("company_id", companyIds);

    if (companyId) {
      query = query.eq("company_id", companyId);
    }

    if (jobOfferId) {
      query = query.eq("job_offer_id", jobOfferId);
    }

    const { data: matches, error } = await query.order("match_score", { ascending: false });

    if (error) {
      console.error("[beyond-connect/matches] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!matches || matches.length === 0) {
      return NextResponse.json({ matches: [] });
    }

    // Pour les matchings, on affiche tous les candidats qui matchent
    // (pas de filtre BtoC/BtoB pour les matchings)
    return NextResponse.json({ matches });
  } catch (error) {
    console.error("[beyond-connect/matches] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

