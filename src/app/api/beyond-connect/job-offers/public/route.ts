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
    const limit = searchParams.get("limit");
    const sort = searchParams.get("sort") || "created_at";

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
      .order(sort, { ascending: false });

    if (contractType) {
      query = query.eq("contract_type", contractType);
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        query = query.limit(limitNum);
      }
    }

    const { data: jobOffers, error } = await query;

    if (error) {
      console.error("[beyond-connect/job-offers/public] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Normaliser les données : convertir beyond_connect_companies (tableau) en company (objet)
    const normalizedOffers = (jobOffers || []).map((offer: any) => {
      let company = offer.company;
      if (!company && offer.beyond_connect_companies && Array.isArray(offer.beyond_connect_companies) && offer.beyond_connect_companies.length > 0) {
        company = offer.beyond_connect_companies[0];
      }
      return {
        ...offer,
        company: company || { id: "", name: "Entreprise non spécifiée", logo_url: undefined },
      };
    });

    return NextResponse.json({ jobOffers: normalizedOffers });
  } catch (error) {
    console.error("[beyond-connect/job-offers/public] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}


