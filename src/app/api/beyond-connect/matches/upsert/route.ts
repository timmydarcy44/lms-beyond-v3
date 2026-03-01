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

    const body = await request.json();
    const { talent_id, job_offer_id, match_score } = body || {};

    if (!talent_id || !job_offer_id || typeof match_score !== "number") {
      return NextResponse.json({ error: "talent_id, job_offer_id et match_score sont requis" }, { status: 400 });
    }

    const payload = {
      company_id: user.id,
      talent_id,
      job_offer_id,
      match_score,
    };

    console.log("Données envoyées à Supabase:", payload);

    const { data, error } = await supabase
      .from("matches")
      .upsert(payload, { onConflict: "company_id,talent_id,job_offer_id" })
      .select()
      .single();

    if (error) {
      console.error("Erreur Supabase détaillée:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ status: "ok", match: data });
  } catch (error) {
    console.error("[beyond-connect/matches/upsert] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
