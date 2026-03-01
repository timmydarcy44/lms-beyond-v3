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
    const companyId = searchParams.get("company_id") || user.id;
    const jobOfferId = searchParams.get("job_offer_id");

    let query = supabase
      .from("matches")
      .select("*, profiles(*)")
      .eq("company_id", companyId);

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

    const offerIds = Array.from(new Set(matches.map((m: any) => m.job_offer_id).filter(Boolean)));
    const offersRes = offerIds.length > 0
      ? await supabase.from("job_offers").select("id, title, contract_type").in("id", offerIds)
      : { data: [] as any[] };
    const offerMap = new Map((offersRes.data || []).map((o: any) => [o.id, o]));

    const hydratedMatches = matches.map((match: any) => ({
      ...match,
      profiles: match.profiles || null,
      beyond_connect_job_offers: offerMap.get(match.job_offer_id) || null,
    }));

    return NextResponse.json({ matches: hydratedMatches });
  } catch (error) {
    console.error("[beyond-connect/matches] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

