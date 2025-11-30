import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère les candidatures de l'utilisateur connecté
 * GET /api/beyond-connect/applications/my
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

    const { data: applications, error } = await supabase
      .from("beyond_connect_applications")
      .select(
        `
        id,
        status,
        cover_letter,
        created_at,
        updated_at,
        job_offer:job_offer_id (
          id,
          title,
          contract_type,
          location,
          company:beyond_connect_companies (
            id,
            name,
            logo_url
          )
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[api/beyond-connect/applications/my] Error:", error);
      return NextResponse.json({ error: "Erreur lors de la récupération" }, { status: 500 });
    }

    // Transformer les données pour faciliter l'utilisation côté client
    const transformedApplications = (applications || []).map((app: any) => ({
      id: app.id,
      status: app.status,
      cover_letter: app.cover_letter,
      applied_at: app.created_at, // Utiliser created_at comme applied_at
      updated_at: app.updated_at,
      job_offer: {
        id: app.job_offer.id,
        title: app.job_offer.title,
        contract_type: app.job_offer.contract_type,
        location: app.job_offer.location,
        company: {
          id: app.job_offer.company.id,
          name: app.job_offer.company.name,
          logo_url: app.job_offer.company.logo_url,
        },
      },
    }));

    return NextResponse.json({ applications: transformedApplications });
  } catch (error) {
    console.error("[api/beyond-connect/applications/my] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des candidatures" },
      { status: 500 }
    );
  }
}

