import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les offres d'emploi publiques (actives)
 * GET /api/beyond-connect/job-offers/public
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const contractType = searchParams.get("contract_type");

    let query = supabase
      .from("beyond_connect_job_offers")
      .select(`
        *,
        beyond_connect_companies(
          id,
          name,
          logo_url
        )
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (contractType) {
      query = query.eq("contract_type", contractType);
    }

    const { data: jobOffers, error } = await query;

    if (error) {
      console.error("[beyond-connect/job-offers/public] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobOffers: jobOffers || [] });
  } catch (error) {
    console.error("[beyond-connect/job-offers/public] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

