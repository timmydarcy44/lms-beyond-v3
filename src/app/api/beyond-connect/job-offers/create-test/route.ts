import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase non configuré" }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const payload = {
      company_id: user.id,
      created_by: user.id,
      title: "Offre de test",
      description: "Offre de test générée automatiquement pour l'analyse IA.",
      contract_type: "Alternance",
      location: "Rouen",
      is_active: true,
    };

    const { data, error } = await supabase
      .from("job_offers")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ jobOffer: data });
  } catch (error) {
    console.error("[beyond-connect/job-offers/create-test] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
