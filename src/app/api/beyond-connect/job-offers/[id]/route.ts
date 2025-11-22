import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère une offre d'emploi spécifique
 * GET /api/beyond-connect/job-offers/[id]
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;
    const jobOfferId = id;

    // Récupérer les organisations de l'utilisateur
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .in("role", ["admin", "instructor"]);

    if (!memberships || memberships.length === 0) {
      return NextResponse.json({ error: "Accès réservé aux entreprises" }, { status: 403 });
    }

    const orgIds = memberships.map(m => m.org_id);

    // Récupérer l'offre avec l'entreprise
    const { data: jobOffer, error: jobError } = await supabase
      .from("beyond_connect_job_offers")
      .select(`
        *,
        beyond_connect_companies(
          id,
          name,
          organization_id
        )
      `)
      .eq("id", jobOfferId)
      .single();

    if (jobError || !jobOffer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    // Vérifier que l'utilisateur a accès à cette entreprise
    const company = jobOffer.beyond_connect_companies as any;
    if (!company || !orgIds.includes(company.organization_id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    return NextResponse.json({
      jobOffer: {
        ...jobOffer,
        company: {
          id: company.id,
          name: company.name,
        },
      },
    });
  } catch (error) {
    console.error("[beyond-connect/job-offers/[id]] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

