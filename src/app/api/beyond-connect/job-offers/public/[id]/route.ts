import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère une offre d'emploi publique (pour les candidats)
 * GET /api/beyond-connect/job-offers/public/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { id } = await params;
    const jobOfferId = id;

    // Récupérer l'offre publique (active)
    const { data: jobOffer, error: jobError } = await supabase
      .from("beyond_connect_job_offers")
      .select(`
        *,
        beyond_connect_companies(
          id,
          name,
          logo_url,
          description
        )
      `)
      .eq("id", jobOfferId)
      .eq("is_active", true)
      .single();

    if (jobError || !jobOffer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    return NextResponse.json({
      jobOffer: {
        ...jobOffer,
        company: jobOffer.beyond_connect_companies,
      },
    });
  } catch (error) {
    console.error("[beyond-connect/job-offers/public/[id]] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

