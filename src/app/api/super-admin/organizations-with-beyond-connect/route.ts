import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function GET() {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const supabase = await getServiceRoleClient();

    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    // Récupérer toutes les organisations
    const { data: organizations, error: orgError } = await supabase
      .from("organizations")
      .select("id, name")
      .order("name");

    if (orgError) {
      console.error("[organizations-with-beyond-connect] Error fetching organizations:", orgError);
      return NextResponse.json({ error: "Error fetching organizations" }, { status: 500 });
    }

    // Récupérer les features Beyond Connect
    const { data: features, error: featuresError } = await supabase
      .from("organization_features")
      .select("org_id, is_enabled")
      .eq("feature_key", "beyond_connect");

    if (featuresError) {
      console.error("[organizations-with-beyond-connect] Error fetching features:", featuresError);
      return NextResponse.json({ error: "Error fetching features" }, { status: 500 });
    }

    // Créer un map des features
    const featuresMap = new Map(
      features?.map((f) => [f.org_id, f.is_enabled]) || []
    );

    // Récupérer les statistiques pour chaque organisation
    const orgIds = organizations?.map((o) => o.id) || [];
    
    // Compter les membres
    const { data: memberships } = await supabase
      .from("org_memberships")
      .select("org_id")
      .in("org_id", orgIds);

    const membersCountMap = new Map<string, number>();
    memberships?.forEach((m) => {
      membersCountMap.set(m.org_id, (membersCountMap.get(m.org_id) || 0) + 1);
    });

    // Compter les offres d'emploi (si la table existe)
    let jobOffersCountMap = new Map<string, number>();
    try {
      const { data: jobOffers } = await supabase
        .from("beyond_connect_job_offers")
        .select("company_id")
        .in("company_id", orgIds);

      jobOffers?.forEach((jo) => {
        jobOffersCountMap.set(jo.company_id, (jobOffersCountMap.get(jo.company_id) || 0) + 1);
      });
    } catch (error) {
      // La table n'existe peut-être pas encore
      console.log("[organizations-with-beyond-connect] Job offers table not available");
    }

    // Combiner les données
    const organizationsWithFeatures = organizations?.map((org) => ({
      id: org.id,
      name: org.name,
      has_beyond_connect: featuresMap.get(org.id) === true,
      members_count: membersCountMap.get(org.id) || 0,
      job_offers_count: jobOffersCountMap.get(org.id) || 0,
    })) || [];

    return NextResponse.json({ organizations: organizationsWithFeatures });
  } catch (error) {
    console.error("[organizations-with-beyond-connect] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

