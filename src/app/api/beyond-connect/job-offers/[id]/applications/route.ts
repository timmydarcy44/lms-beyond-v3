import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les candidatures pour une offre d'emploi (entreprises) ou vérifie si le candidat a postulé
 * GET /api/beyond-connect/job-offers/[id]/applications
 * POST /api/beyond-connect/job-offers/[id]/applications
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
    const { searchParams } = new URL(request.url);
    const checkOnly = searchParams.get("check") === "true";

    // Si c'est une vérification pour un candidat
    if (checkOnly) {
      const { data: application } = await supabase
        .from("beyond_connect_applications")
        .select("*")
        .eq("job_offer_id", jobOfferId)
        .eq("user_id", user.id)
        .maybeSingle();

      return NextResponse.json({
        hasApplied: !!application,
        application: application || null,
      });
    }

    // Sinon, c'est pour une entreprise qui veut voir les candidatures
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

export async function POST(
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
    const body = await request.json();
    const { cover_letter } = body;

    if (!cover_letter || !cover_letter.trim()) {
      return NextResponse.json({ error: "La lettre de motivation est requise" }, { status: 400 });
    }

    // Vérifier que l'offre existe et est active
    const { data: jobOffer, error: jobOfferError } = await supabase
      .from("beyond_connect_job_offers")
      .select("id, is_active, application_deadline, company_id")
      .eq("id", jobOfferId)
      .single();

    if (jobOfferError || !jobOffer) {
      return NextResponse.json({ error: "Offre non trouvée" }, { status: 404 });
    }

    if (!jobOffer.is_active) {
      return NextResponse.json({ error: "Cette offre n'est plus active" }, { status: 400 });
    }

    if (jobOffer.application_deadline) {
      const deadline = new Date(jobOffer.application_deadline);
      if (deadline < new Date()) {
        return NextResponse.json({ error: "La date limite de candidature est dépassée" }, { status: 400 });
      }
    }

    // Vérifier si le candidat a déjà postulé
    const { data: existingApplication } = await supabase
      .from("beyond_connect_applications")
      .select("id")
      .eq("job_offer_id", jobOfferId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingApplication) {
      return NextResponse.json({ error: "Vous avez déjà postulé à cette offre" }, { status: 400 });
    }

    // Créer la candidature
    const { data: application, error: applicationError } = await supabase
      .from("beyond_connect_applications")
      .insert({
        job_offer_id: jobOfferId,
        user_id: user.id,
        company_id: jobOffer.company_id,
        cover_letter: cover_letter.trim(),
        status: "pending",
      })
      .select()
      .single();

    if (applicationError) {
      console.error("[beyond-connect/job-offers/[id]/applications] Error creating application:", applicationError);
      return NextResponse.json({ error: "Erreur lors de la création de la candidature" }, { status: 500 });
    }

    // Incrémenter le compteur de candidatures de l'offre
    const { data: currentOffer } = await supabase
      .from("beyond_connect_job_offers")
      .select("applications_count")
      .eq("id", jobOfferId)
      .single();

    if (currentOffer) {
      await supabase
        .from("beyond_connect_job_offers")
        .update({ applications_count: (currentOffer.applications_count || 0) + 1 })
        .eq("id", jobOfferId);
    }

    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    console.error("[beyond-connect/job-offers/[id]/applications] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

