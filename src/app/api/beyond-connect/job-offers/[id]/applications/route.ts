import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les candidatures pour une offre d'emploi
 * GET /api/beyond-connect/job-offers/[id]/applications
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

    // Vérifier que l'offre appartient à une entreprise de l'utilisateur
    const { data: jobOffer } = await supabase
      .from("beyond_connect_job_offers")
      .select(`
        id,
        beyond_connect_companies!inner(
          id,
          organization_id
        )
      `)
      .eq("id", jobOfferId)
      .single();

    if (!jobOffer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    const company = (jobOffer as any).beyond_connect_companies;
    if (!company || !orgIds.includes(company.organization_id)) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Récupérer les candidatures avec les profils et le score de matching
    const { data: applications, error } = await supabase
      .from("beyond_connect_applications")
      .select(`
        *,
        profiles!beyond_connect_applications_user_id_fkey(
          id,
          email,
          first_name,
          last_name,
          full_name,
          avatar_url
        )
      `)
      .eq("job_offer_id", jobOfferId)
      .order("match_score", { ascending: false });

    if (error) {
      console.error("[beyond-connect/job-offers/[id]/applications] Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ applications: applications || [] });
  } catch (error) {
    console.error("[beyond-connect/job-offers/[id]/applications] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

